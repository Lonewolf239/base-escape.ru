import http.server
import socketserver
import platform
import os
import datetime
import logging
import sys
import webbrowser
import threading
import urllib.parse
import subprocess
import re

PORT = 8000
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BORDER_LENGTH = 48


logging.basicConfig(
    level=logging.INFO,
    format='\033[92m[%(levelname)s]\033[0m %(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    stream=sys.stdout
)


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def process_htaccess(self, url_path):
        htaccess_path = os.path.join(DIRECTORY, '.htaccess')

        if not os.path.exists(htaccess_path):
            if url_path == "/" or url_path == "":
                return 200, "/index.php" if os.path.exists(os.path.join(DIRECTORY, "index.php")) else "/index.html"
            return 200, url_path

        match_path = url_path.lstrip('/')

        with open(htaccess_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        rewrite_engine = False
        conditions = []
        directory_index = ['index.php', 'index.html', 'index.htm']

        for line in lines:
            line = line.split('#')[0].strip()
            if not line: continue

            parts = line.split()
            directive = parts[0].upper()

            if directive == 'DIRECTORYINDEX':
                directory_index = parts[1:]
                continue

            if directive == 'REWRITEENGINE':
                rewrite_engine = (parts[1].upper() == 'ON')
                continue

            if directive == 'REWRITECOND':
                if len(parts) >= 3:
                    flags = parts[3] if len(parts) > 3 else ""
                    conditions.append((parts[1], parts[2], flags))
                continue

            if directive == 'REWRITERULE' and rewrite_engine:
                if len(parts) >= 3:
                    pattern = parts[1]
                    substitution = parts[2]
                    flags_raw = parts[3].upper() if len(parts) > 3 else ""

                    rule_flags = {}
                    if flags_raw.startswith('[') and flags_raw.endswith(']'):
                        for flag in flags_raw.strip('[]').split(','):
                            flag = flag.strip()
                            if '=' in flag:
                                k, v = flag.split('=', 1)
                                rule_flags[k] = v
                            else:
                                rule_flags[flag] = True

                    conditions_passed = True
                    for cond_test_string, cond_pattern, cond_flags_raw in conditions:
                        cond_flags = {}
                        if cond_flags_raw.startswith('[') and cond_flags_raw.endswith(']'):
                            for flag in cond_flags_raw.strip('[]').split(','):
                                cond_flags[flag.strip()] = True

                        test_val = cond_test_string
                        test_val = test_val.replace('%{THE_REQUEST}', f"{self.command} {self.path} HTTP/1.1")
                        test_val = test_val.replace('%{REQUEST_URI}', url_path.split('?')[0])
                        test_val = test_val.replace('%{REQUEST_FILENAME}', os.path.join(DIRECTORY, url_path.split('?')[0].lstrip('/')))

                        is_negated = cond_pattern.startswith('!')
                        actual_pattern = cond_pattern[1:] if is_negated else cond_pattern

                        cond_match = False
                        if actual_pattern == '-f':
                            cond_match = os.path.isfile(test_val)
                        elif actual_pattern == '-d':
                            cond_match = os.path.isdir(test_val)
                        else:
                            try:
                                re_flags = re.IGNORECASE if 'NC' in cond_flags else 0
                                cond_match = bool(re.search(actual_pattern, test_val, re_flags))
                            except re.error:
                                pass

                        if (cond_match and is_negated) or (not cond_match and not is_negated):
                            conditions_passed = False
                            break

                    if conditions_passed:
                        try:
                            re_flags = re.IGNORECASE if 'NC' in rule_flags else 0
                            match = re.search(pattern, match_path, re_flags)

                            if match:
                                if 'F' in rule_flags:
                                    return 403, ""

                                if substitution != '-':
                                    def apache_sub(m):
                                        res = substitution
                                        for i, grp in enumerate(m.groups(), 1):
                                            res = res.replace(f'${i}', grp or '')
                                        return res

                                    new_path = re.sub(pattern, apache_sub, match_path, flags=re_flags)
                                else:
                                    new_path = match_path

                                if 'R' in rule_flags:
                                    r_val = rule_flags['R']
                                    redirect_code = int(r_val) if r_val is not True else 302
                                    if not new_path.startswith('http') and not new_path.startswith('/'):
                                        new_path = '/' + new_path
                                    return redirect_code, new_path

                                match_path = new_path.lstrip('/') if new_path.startswith('/') else new_path

                                if 'L' in rule_flags:
                                    conditions = []
                                    break
                        except re.error:
                            pass

                    conditions = []

        final_path = '/' + match_path

        physical_path = os.path.join(DIRECTORY, match_path.split('?')[0])
        if os.path.isdir(physical_path):
            for index_file in directory_index:
                if os.path.isfile(os.path.join(physical_path, index_file)):
                    final_path = final_path.rstrip('/') + '/' + index_file
                    break

        return 200, final_path

    def apply_rewrite(self):
        parsed_url = urllib.parse.urlparse(self.path)
        clean_path = parsed_url.path
        query = parsed_url.query

        status_code, rewritten_path = self.process_htaccess(clean_path)

        if status_code in (301, 302, 303, 307, 308):
            self.send_response(status_code)
            self.send_header('Location', rewritten_path)
            self.end_headers()
            return True 

        if status_code == 403:
            self.send_error(403, "Forbidden by .htaccess rules")
            return True

        if '?' in rewritten_path:
            base_path, new_query = rewritten_path.split('?', 1)
            query = f"{new_query}&{query}" if query else new_query
            rewritten_path = base_path

        self.rewritten_path = rewritten_path
        self.rewritten_query = query
        self.path = f"{rewritten_path}?{query}" if query else rewritten_path

        return False

    def translate_path(self, path):
        parsed_url = urllib.parse.urlparse(path)
        clean_path = parsed_url.path
        return os.path.join(DIRECTORY, clean_path.lstrip("/"))

    def do_GET(self):
        if self.apply_rewrite():
            return

        if self.rewritten_path.endswith('.php'):
            filepath = os.path.join(DIRECTORY, self.rewritten_path.lstrip("/"))
            if os.path.exists(filepath):
                self.run_php(filepath, self.rewritten_query, method='GET')
            else:
                self.send_error(404, "PHP file not found")
            return

        super().do_GET()

    def do_POST(self):
        if self.apply_rewrite():
            return

        if self.rewritten_path.endswith('.php'):
            filepath = os.path.join(DIRECTORY, self.rewritten_path.lstrip("/"))
            if os.path.exists(filepath):
                content_length = int(self.headers.get('Content-Length', 0))
                content_type = self.headers.get('Content-Type', '')

                post_data = self.rfile.read(content_length) if content_length > 0 else b''

                self.run_php(
                    filepath, 
                    self.rewritten_query, 
                    method='POST', 
                    post_data=post_data, 
                    content_type=content_type
                )
            else:
                self.send_error(404, "PHP file not found")
            return

        self.send_error(501, "Can only POST to PHP scripts")

    def run_php(self, filepath, query_string, method='GET', post_data=b'', content_type=''):
        env = os.environ.copy()
        env['REQUEST_METHOD'] = method
        env['QUERY_STRING'] = query_string
        env['REDIRECT_STATUS'] = '200'
        env['SCRIPT_FILENAME'] = filepath

        if method == 'POST':
            env['CONTENT_LENGTH'] = str(len(post_data))
            if content_type:
                env['CONTENT_TYPE'] = content_type

        try:
            process = subprocess.Popen(
                ['php-cgi', filepath],
                env=env,
                stdin=subprocess.PIPE if method == 'POST' else None,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            stdout, stderr = process.communicate(input=post_data if method == 'POST' else None)

            if process.returncode != 0:
                self.send_error(500, f"PHP Error: {stderr.decode('utf-8', errors='replace')}")
                return

            if b'\r\n\r\n' in stdout:
                headers_raw, body = stdout.split(b'\r\n\r\n', 1)
            elif b'\n\n' in stdout:
                headers_raw, body = stdout.split(b'\n\n', 1)
            else:
                headers_raw, body = b'', stdout

            status_code = 200
            headers = []

            for header_line in headers_raw.splitlines():
                if b':' in header_line:
                    key, val = header_line.split(b':', 1)
                    key_str = key.decode('utf-8').strip()
                    val_str = val.decode('utf-8').strip()

                    if key_str.lower() == 'status':
                        status_code = int(val_str.split()[0])
                    else:
                        headers.append((key_str, val_str))

            self.send_response(status_code)
            for k, v in headers:
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        except FileNotFoundError:
            self.send_error(500, "Ошибка: исполняемый файл 'php-cgi' не найден. Убедись, что PHP установлен и добавлен в системный PATH.")


def clear_console():
    system_platform = platform.system().lower()
    if system_platform == "windows":
        os.system("cls")
    else:
        os.system("clear")


def print_border():
    print("=" * BORDER_LENGTH)


def print_messages(messages):
    if not messages:
        return
    max_key_length = max(len(message.split(":", 1)[0].strip()) for message in messages)

    for message in messages:
        if ":" not in message:
            print(message)
            continue
        key, value = message.split(":", 1)
        key = key.strip()
        value = value.strip()
        print(f"  \033[1m[\033[0m {key} \033[1m]\033[0m {' ' * (max_key_length - len(key) + 1)}{value}")


def print_centered_text(text):
    space_length = int((BORDER_LENGTH - len(text)) / 2)
    print(f"{' ' * space_length}{text}{' ' * space_length if len(text) % 2 == 0 else ' ' * (space_length - 1)}")


def print_startup_message(port, directory):
    print_border()
    print_centered_text("HTTP Server Started")
    print_border()
    messages = [
        "",
        f"Working Directory: {os.path.abspath(directory)}",
        f"Access URL: http://localhost:{port}",
        f"Startup Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        f"Python Version: {sys.version.split()[0]}",
        f"Platform: {platform.platform()}",
        "",
        "To stop: Esc",
        ""
    ]
    print_messages(messages)
    print_border()
    print_centered_text("Logs")
    print_border()
    print()


def open_browser(port):
    url = f"http://localhost:{port}"
    try:
        webbrowser.open_new_tab(url)
        logging.info(f"Browser opened at: {url}")
    except webbrowser.Error as e:
        logging.error(f"Failed to open browser: {e}")


def wait_for_esc():
    try:
        import msvcrt
    except ImportError:
        msvcrt = None
    try:
        import tty
        import termios
    except ImportError:
        tty = None
        termios = None
    if msvcrt:
        while True:
            if msvcrt.kbhit():
                char = msvcrt.getch()
                if char == b'\x1b':
                    break
    elif tty and termios:
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setcbreak(fd)
            while True:
                if sys.stdin.read(1) == '\x1b':
                    break
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)


def start_server(port, directory):
    try:
        with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
            logging.info(f"HTTP server started on port {port}, serving directory: {directory}")
            httpd.serve_forever()
    except OSError as e:
        logging.error(f"Error starting server: {e}")
        if 'Address already in use' in str(e):
            print("\n\033[91mPort is already in use.  Check if another server or application is running on this port.\033[0m")
        else:
            print(f"\n\033[91mError: {e}\033[0m")


def main():
    clear_console()
    print_startup_message(PORT, DIRECTORY)
    server_thread = threading.Thread(target=start_server, args=(PORT, DIRECTORY))
    server_thread.daemon = True
    server_thread.start()
    open_browser(PORT)
    try:
        wait_for_esc()
    except KeyboardInterrupt:
        pass    
    print("\n\033[91mServer stopped.\033[0m")
    print("\033[93mGoodbye!\033[0m\n")


if __name__ == "__main__":
    main()
