path = r'C:\Users\lclem\OneDrive\Documents\educa-cemi\app\static\js\app.js'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar errorModal após successModal
old_success_end = '''  setTimeout(() => closeModal(), 1000);

}


'''
new_success_end = '''  setTimeout(() => closeModal(), 1000);

}

function errorModal(message) {

  openModal(`

    <div class="flex flex-col items-center gap-3">

      <i data-lucide="x-circle" class="w-12 h-12 text-red-500"></i>

      <p class="font-medium">${message}</p>

    </div>

  `);

  setTimeout(() => closeModal(), 1000);

}


'''

if old_success_end in content:
    content = content.replace(old_success_end, new_success_end, 1)
    print('errorModal adicionado')
else:
    print('old_success_end NAO encontrado')

# 2. Remover a funcao toast completamente
old_toast = '''// Toast

function toast(msg, ok = true) {

  const t = document.getElementById('toast');

  t.textContent = msg;

  t.className = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow text-white ' + (ok ? 'bg-green-600' : 'bg-red-600');

  t.classList.remove('hidden');

  setTimeout(() => t.classList.add('hidden'), 3000);

}



'''

if old_toast in content:
    content = content.replace(old_toast, '', 1)
    print('toast removido')
else:
    print('toast NAO encontrado')

# 3. Substituir chamadas de toast por successModal ou errorModal
import re

# toast(msg, false) -> errorModal(msg)
# Precisa tratar antes de toast(msg) para nao pegar o false

# Padrão: toast('...', false) ou toast(... , false)
content = re.sub(
    r"toast\((.+?),\s*false\)",
    r"errorModal(\1)",
    content
)

# Padrão: toast('...') -> successModal('...')
# Incluindo template literais com backtick
content = re.sub(
    r"toast\((.+?)\)",
    r"successModal(\1)",
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Substituicoes concluídas')