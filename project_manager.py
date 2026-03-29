import json
import os
import webbrowser
from datetime import datetime
from pathlib import Path
import curses
import time

class ProjectManagerUI:
    def __init__(self, filepath="projects.json"):
        self.filepath = Path(filepath)
        self.projects = []
        self.current_index = 0
        self.current_project = None
        self.edit_mode = False
        self.search_query = ""
        self.filtered_projects = []
        self.message = ""
        self.message_time = 0
        self.load_projects()
        
    def load_projects(self):
        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                self.projects = json.load(f)
            self.filtered_projects = self.projects.copy()
        except:
            self.projects = []
            self.filtered_projects = []
            
    def save_projects(self):
        try:
            with open(self.filepath, 'w', encoding='utf-8') as f:
                json.dump(self.projects, f, indent=4, ensure_ascii=False)
            self.set_message("Projects saved successfully!")
        except Exception as e:
            self.set_message(f"Error saving: {str(e)}")
            
    def set_message(self, msg):
        self.message = msg
        self.message_time = time.time()
        
    def filter_projects(self):
        if not self.search_query:
            self.filtered_projects = self.projects.copy()
        else:
            query = self.search_query.lower()
            self.filtered_projects = [
                p for p in self.projects
                if query in p['title']['en'].lower() or
                query in p['title'].get('ru', '').lower() or
                query in p['title'].get('de', '').lower() or
                any(query in tag.lower() for tag in p.get('tags', []))
            ]
            
        if self.current_index >= len(self.filtered_projects):
            self.current_index = max(0, len(self.filtered_projects) - 1)
        if self.filtered_projects:
            self.current_project = self.filtered_projects[self.current_index]
            
    def draw_menu(self, stdscr):
        stdscr.clear()
        height, width = stdscr.getmaxyx()
        
        title = " PROJECT MANAGER - Lonewolf239 "
        stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
        stdscr.addstr(0, (width - len(title)) // 2, title)
        stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
        
        stdscr.attron(curses.color_pair(3))
        stdscr.addstr(2, 2, "=" * (width - 4))
        stdscr.attroff(curses.color_pair(3))
        
        if self.message and time.time() - self.message_time < 3:
            stdscr.attron(curses.color_pair(2))
            stdscr.addstr(3, 2, self.message[:width-4])
            stdscr.attroff(curses.color_pair(2))
        
        search_label = f"🔍 Search: {self.search_query}"
        stdscr.addstr(4, 2, search_label)
        stdscr.addstr(4, len(search_label) + 2, "[Press / to search]")
        
        stats = f"Projects: {len(self.filtered_projects)}/{len(self.projects)}"
        stdscr.addstr(5, width - len(stats) - 2, stats)
        
        if self.filtered_projects:
            project = self.filtered_projects[self.current_index]
            title = project['title']['en']
            lang = project.get('language', '')
            if isinstance(lang, list):
                lang = ', '.join(lang)
            
            stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
            stdscr.addstr(7, 2, f"📦 {title}")
            stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
            stdscr.addstr(8, 4, f"💻 Language: {lang}")
            
            desc = project['description']['en']
            if len(desc) > width - 10:
                desc = desc[:width-13] + "..."
            stdscr.addstr(9, 4, f"📝 {desc}")
            
            tags = ', '.join(project.get('tags', []))
            if len(tags) > width - 10:
                tags = tags[:width-13] + "..."
            stdscr.addstr(10, 4, f"🏷️  Tags: {tags}")
            
            if 'lastRelease' in project:
                stdscr.addstr(11, 4, f"📅 Last Release: {project['lastRelease']}")
                
            line_y = 13
            stdscr.addstr(line_y, 2, "🔗 Links:")
            line_y += 1
            
            links = project.get('links', {})
            for link_type, url in links.items():
                if isinstance(url, dict):
                    if 'url' in url:
                        display_url = url['url'].get('en', str(url))
                    else:
                        display_url = str(url)
                else:
                    display_url = url
                if len(display_url) > width - 15:
                    display_url = display_url[:width-18] + "..."
                stdscr.addstr(line_y, 4, f"• {link_type.upper()}: {display_url}")
                line_y += 1
                
            if 'subprojects' in project:
                stdscr.addstr(line_y, 2, f"📦 Subprojects: {len(project['subprojects'])}")
                line_y += 1
                
            nav_info = f"Project {self.current_index + 1} of {len(self.filtered_projects)}"
            stdscr.addstr(height - 3, (width - len(nav_info)) // 2, nav_info)
            
        else:
            stdscr.attron(curses.color_pair(2))
            stdscr.addstr(10, (width - 30) // 2, "No projects found")
            stdscr.attroff(curses.color_pair(2))
            
        menu_y = height - 5
        stdscr.attron(curses.color_pair(3))
        stdscr.addstr(menu_y, 2, "─" * (width - 4))
        stdscr.attroff(curses.color_pair(3))
        
        menu_items = [
            "↑/↓: Navigate",
            "Enter: Open Links Menu",
            "E: Edit Project",
            "A: Add Project",
            "D: Delete Project",
            "F: Filter Projects",
            "S: Save",
            "Q: Quit"
        ]
        
        menu_x = 2
        for item in menu_items:
            stdscr.addstr(menu_y + 1, menu_x, item)
            menu_x += len(item) + 3
            if menu_x > width - 2:
                menu_x = 2
                
        stdscr.refresh()
        
    def draw_edit_menu(self, stdscr, project):
        height, width = stdscr.getmaxyx()
        current_field = 0
        fields = ['title_en', 'title_ru', 'title_de', 'desc_en', 'desc_ru', 'desc_de', 'language', 'tags', 'github', 'download', 'lastRelease']
        field_values = {}
        
        field_values['title_en'] = project['title']['en']
        field_values['title_ru'] = project['title'].get('ru', '')
        field_values['title_de'] = project['title'].get('de', '')
        field_values['desc_en'] = project['description']['en']
        field_values['desc_ru'] = project['description'].get('ru', '')
        field_values['desc_de'] = project['description'].get('de', '')
        field_values['language'] = project.get('language', '')
        if isinstance(field_values['language'], list):
            field_values['language'] = ', '.join(field_values['language'])
        field_values['tags'] = ', '.join(project.get('tags', []))
        field_values['github'] = project.get('links', {}).get('github', '')
        field_values['download'] = project.get('links', {}).get('download', '')
        field_values['lastRelease'] = project.get('lastRelease', '')
        
        edit_fields = []
        
        while True:
            stdscr.clear()
            
            title = " EDIT PROJECT "
            stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
            stdscr.addstr(0, (width - len(title)) // 2, title)
            stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
            
            stdscr.addstr(2, 2, "Use ↑/↓ to navigate, Enter to edit, Esc to exit")
            stdscr.attron(curses.color_pair(3))
            stdscr.addstr(3, 2, "=" * (width - 4))
            stdscr.attroff(curses.color_pair(3))
            
            y = 5
            for i, field in enumerate(fields):
                label = field.replace('_', ' ').upper()
                value = field_values[field]
                if len(value) > width - 30:
                    value = value[:width-33] + "..."
                    
                if i == current_field:
                    stdscr.attron(curses.color_pair(1) | curses.A_REVERSE)
                    stdscr.addstr(y, 2, f"{label:20}: {value}")
                    stdscr.attroff(curses.color_pair(1) | curses.A_REVERSE)
                else:
                    stdscr.addstr(y, 2, f"{label:20}: {value}")
                y += 1
                
            stdscr.addstr(y + 1, 2, "[Enter] Edit field  [Esc] Save & Exit")
            stdscr.refresh()
            
            key = stdscr.getch()
            
            if key == curses.KEY_UP:
                current_field = (current_field - 1) % len(fields)
            elif key == curses.KEY_DOWN:
                current_field = (current_field + 1) % len(fields)
            elif key == 10:
                stdscr.clear()
                field_name = fields[current_field]
                current_value = field_values[field_name]
                stdscr.addstr(0, 0, f"Edit {field_name}: {current_value}")
                stdscr.addstr(1, 0, "New value: ")
                stdscr.refresh()
                
                curses.echo()
                new_value = ""
                while True:
                    char = stdscr.getch()
                    if char == 10:
                        break
                    elif char == 27:
                        new_value = current_value
                        break
                    else:
                        new_value += chr(char)
                curses.noecho()
                
                if new_value != current_value:
                    field_values[field_name] = new_value
                    self.set_message(f"Updated {field_name}")
            elif key == 27:
                project['title']['en'] = field_values['title_en']
                if field_values['title_ru']:
                    project['title']['ru'] = field_values['title_ru']
                if field_values['title_de']:
                    project['title']['de'] = field_values['title_de']
                    
                project['description']['en'] = field_values['desc_en']
                if field_values['desc_ru']:
                    project['description']['ru'] = field_values['desc_ru']
                if field_values['desc_de']:
                    project['description']['de'] = field_values['desc_de']
                    
                if ',' in field_values['language']:
                    project['language'] = [l.strip() for l in field_values['language'].split(',')]
                else:
                    project['language'] = field_values['language']
                    
                project['tags'] = [t.strip() for t in field_values['tags'].split(',') if t.strip()]
                
                if 'links' not in project:
                    project['links'] = {}
                if field_values['github']:
                    project['links']['github'] = field_values['github']
                if field_values['download']:
                    project['links']['download'] = field_values['download']
                    
                if field_values['lastRelease']:
                    project['lastRelease'] = field_values['lastRelease']
                    
                self.save_projects()
                self.filter_projects()
                return True
                
    def draw_links_menu(self, stdscr, project):
        height, width = stdscr.getmaxyx()
        links = []
        link_urls = []
        
        for link_type, url in project.get('links', {}).items():
            if isinstance(url, dict):
                if 'url' in url:
                    display_url = url['url'].get('en', str(url))
                else:
                    display_url = str(url)
            else:
                display_url = url
            links.append(link_type.upper())
            link_urls.append(display_url)
            
        if not links:
            self.set_message("No links available")
            return
            
        current_link = 0
        
        while True:
            stdscr.clear()
            
            title = f" LINKS - {project['title']['en']} "
            stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
            stdscr.addstr(0, (width - len(title)) // 2, title)
            stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
            
            stdscr.addstr(2, 2, "Select a link to open in browser")
            stdscr.attron(curses.color_pair(3))
            stdscr.addstr(3, 2, "=" * (width - 4))
            stdscr.attroff(curses.color_pair(3))
            
            y = 5
            for i, (name, url) in enumerate(zip(links, link_urls)):
                display_url = url
                if len(display_url) > width - 15:
                    display_url = display_url[:width-18] + "..."
                    
                if i == current_link:
                    stdscr.attron(curses.color_pair(1) | curses.A_REVERSE)
                    stdscr.addstr(y, 4, f"{name}: {display_url}")
                    stdscr.attroff(curses.color_pair(1) | curses.A_REVERSE)
                else:
                    stdscr.addstr(y, 4, f"{name}: {display_url}")
                y += 1
                
            stdscr.addstr(y + 2, 2, "↑/↓: Navigate  Enter: Open  Esc: Back")
            stdscr.refresh()
            
            key = stdscr.getch()
            
            if key == curses.KEY_UP:
                current_link = (current_link - 1) % len(links)
            elif key == curses.KEY_DOWN:
                current_link = (current_link + 1) % len(links)
            elif key == 10:
                webbrowser.open(link_urls[current_link])
                self.set_message(f"Opened {links[current_link]}")
            elif key == 27:
                return
                
    def add_project_wizard(self, stdscr):
        height, width = stdscr.getmaxyx()
        
        new_project = {
            'title': {},
            'description': {},
            'tags': [],
            'links': {}
        }
        
        fields = [
            ('title_en', 'Project Name (EN)', ''),
            ('title_ru', 'Project Name (RU)', ''),
            ('title_de', 'Project Name (DE)', ''),
            ('desc_en', 'Description (EN)', ''),
            ('desc_ru', 'Description (RU)', ''),
            ('desc_de', 'Description (DE)', ''),
            ('language', 'Language (C#/Python/C++ etc)', ''),
            ('tags', 'Tags (comma separated)', ''),
            ('github', 'GitHub URL', ''),
            ('download', 'Download URL', ''),
            ('lastRelease', 'Last Release (YYYY-MM-DD)', '')
        ]
        
        values = {}
        current_field = 0
        
        while current_field < len(fields):
            stdscr.clear()
            field_name, label, default = fields[current_field]
            
            title = " ADD NEW PROJECT "
            stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
            stdscr.addstr(0, (width - len(title)) // 2, title)
            stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
            
            stdscr.addstr(2, 2, f"Field {current_field + 1} of {len(fields)}")
            stdscr.addstr(3, 2, label)
            stdscr.addstr(4, 2, "=" * (width - 4))
            stdscr.addstr(5, 2, "Enter value (or press Esc to cancel): ")
            
            if field_name in values:
                stdscr.addstr(5, 45, values[field_name])
            
            stdscr.refresh()
            
            curses.echo()
            cursor_y, cursor_x = 5, 45
            if field_name in values:
                cursor_x += len(values[field_name])
            stdscr.move(cursor_y, cursor_x)
            
            value = ""
            while True:
                char = stdscr.getch()
                if char == 10:
                    break
                elif char == 27:
                    curses.noecho()
                    return False
                else:
                    value += chr(char)
            curses.noecho()
            
            values[field_name] = value.strip()
            current_field += 1
            
        new_project['title']['en'] = values['title_en']
        if values['title_ru']:
            new_project['title']['ru'] = values['title_ru']
        if values['title_de']:
            new_project['title']['de'] = values['title_de']
            
        new_project['description']['en'] = values['desc_en']
        if values['desc_ru']:
            new_project['description']['ru'] = values['desc_ru']
        if values['desc_de']:
            new_project['description']['de'] = values['desc_de']
            
        if ',' in values['language']:
            new_project['language'] = [l.strip() for l in values['language'].split(',')]
        else:
            new_project['language'] = values['language']
            
        new_project['tags'] = [t.strip() for t in values['tags'].split(',') if t.strip()]
        
        if values['github']:
            new_project['links']['github'] = values['github']
        if values['download']:
            new_project['links']['download'] = values['download']
            
        if values['lastRelease']:
            new_project['lastRelease'] = values['lastRelease']
            
        self.projects.append(new_project)
        self.filter_projects()
        self.save_projects()
        self.set_message(f"Added project: {new_project['title']['en']}")
        return True
        
    def delete_project(self):
        if not self.filtered_projects:
            self.set_message("No project selected")
            return False
            
        project = self.filtered_projects[self.current_index]
        self.projects.remove(project)
        self.filter_projects()
        self.save_projects()
        self.set_message(f"Deleted: {project['title']['en']}")
        return True
        
    def run(self):
        def main(stdscr):
            curses.curs_set(0)
            curses.init_pair(1, curses.COLOR_CYAN, curses.COLOR_BLACK)
            curses.init_pair(2, curses.COLOR_YELLOW, curses.COLOR_BLACK)
            curses.init_pair(3, curses.COLOR_WHITE, curses.COLOR_BLACK)
            
            self.filter_projects()
            
            while True:
                self.draw_menu(stdscr)
                key = stdscr.getch()
                
                if key == ord('q') or key == ord('Q'):
                    break
                elif key == curses.KEY_UP:
                    if self.filtered_projects:
                        self.current_index = (self.current_index - 1) % len(self.filtered_projects)
                        self.current_project = self.filtered_projects[self.current_index]
                elif key == curses.KEY_DOWN:
                    if self.filtered_projects:
                        self.current_index = (self.current_index + 1) % len(self.filtered_projects)
                        self.current_project = self.filtered_projects[self.current_index]
                elif key == 10:
                    if self.filtered_projects:
                        self.draw_links_menu(stdscr, self.current_project)
                elif key == ord('e') or key == ord('E'):
                    if self.filtered_projects:
                        self.draw_edit_menu(stdscr, self.current_project)
                elif key == ord('a') or key == ord('A'):
                    self.add_project_wizard(stdscr)
                elif key == ord('d') or key == ord('D'):
                    if self.filtered_projects:
                        self.delete_project()
                elif key == ord('f') or key == ord('F'):
                    curses.echo()
                    stdscr.clear()
                    stdscr.addstr(0, 0, "Enter search query: ")
                    stdscr.refresh()
                    query = ""
                    while True:
                        char = stdscr.getch()
                        if char == 10:
                            break
                        elif char == 27:
                            query = ""
                            break
                        else:
                            query += chr(char)
                    curses.noecho()
                    self.search_query = query
                    self.filter_projects()
                elif key == ord('s') or key == ord('S'):
                    self.save_projects()
                elif key == ord('/'):
                    curses.echo()
                    stdscr.clear()
                    stdscr.addstr(0, 0, "Search: ")
                    stdscr.refresh()
                    query = ""
                    while True:
                        char = stdscr.getch()
                        if char == 10:
                            break
                        elif char == 27:
                            query = ""
                            break
                        else:
                            query += chr(char)
                    curses.noecho()
                    self.search_query = query
                    self.filter_projects()
                    
        curses.wrapper(main)

if __name__ == "__main__":
    app = ProjectManagerUI()
    app.run()
