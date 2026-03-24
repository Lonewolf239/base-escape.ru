import http.server
import socketserver
import platform
import os
import datetime
import logging
import sys
import webbrowser
import threading

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

    def translate_path(self, path):
        if path == "/" or path == "":
            path = "index.html"
        return os.path.join(DIRECTORY, path.lstrip("/"))


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
