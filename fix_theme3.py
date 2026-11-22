path = r'C:\Users\lclem\OneDrive\Documents\educa-cemi\app\static\js\app.js'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the theme picker section
start_idx = None
for i, line in enumerate(lines):
    if '// Theme picker' in line:
        start_idx = i
        break

end_idx = None
for i in range(start_idx, len(lines)):
    if '// Date formatting' in lines[i]:
        end_idx = i
        break

new_code = '''// Theme picker
const colorHex = { blue: '#2563eb', red: '#dc2626', pink: '#ec4899', green: '#16a34a', orange: '#ea580c', purple: '#9333ea' };

function applyTheme(color, mode) {
  const html = document.documentElement;
  // Set color theme
  if (color === 'blue') {
    html.removeAttribute('data-theme');
  } else {
    html.setAttribute('data-theme', color);
  }
  // Set dark/light mode
  if (mode === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  // Save to localStorage
  localStorage.setItem('colorTheme', color);
  localStorage.setItem('theme', mode);
  // Update picker button color swatch
  const swatch = document.querySelector('#themePickerBtn .theme-picker-btn');
  if (swatch) {
    swatch.style.background = colorHex[color] || colorHex.blue;
  }
  // Update active swatch
  document.querySelectorAll('.theme-grid-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === color);
  });
}

// Initialize theme from localStorage
(function initThemePicker() {
  const savedColor = localStorage.getItem('colorTheme') || 'blue';
  const savedMode = localStorage.getItem('theme') || 'light';
  applyTheme(savedColor, savedMode);
})();

// Theme picker dropdown toggle
document.getElementById('themePickerBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const dropdown = document.getElementById('themePickerDropdown');
  dropdown.classList.toggle('hidden');
});

// Theme grid swatch click
document.querySelectorAll('.theme-grid-swatch').forEach(swatch => {
  swatch.addEventListener('click', (e) => {
    e.stopPropagation();
    const color = swatch.dataset.color;
    const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    applyTheme(color, mode);
    document.getElementById('themePickerDropdown').classList.add('hidden');
  });
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('themePickerDropdown');
  const btn = document.getElementById('themePickerBtn');
  if (dropdown && !dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

'''

if start_idx is not None and end_idx is not None:
    new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f'Replaced lines {start_idx+1} to {end_idx}')
else:
    print(f'start_idx={start_idx}, end_idx={end_idx}')
