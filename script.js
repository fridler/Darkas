const BASE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6s-5asWdDA0AWwg5lVcgAQh58zZ4O_swh1V9iG1aJ45pYQo4Mq733UkaQi9Zm_zBI/exec';

async function loadSheetNames() {
  try {
    const url = `${BASE_APPS_SCRIPT_URL}?type=list_sheets`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} בטעינת רשימת טאבים`);
    const names = await response.json();
    if (!Array.isArray(names)) throw new Error("תשובה לא תקינה מ-list_sheets");
    return names;
  } catch (err) {
    console.error("שגיאה בטעינת רשימת הטאבים:", err);
    document.getElementById('errorMessage')?.classList.remove('d-none');
    return [];
  }
}

function createPhoneContent(value, showNumber = false) {
  if (!value) return '';

  const raw = value.toString().trim();
  if (!raw) return '';

  const clean = raw.replace(/[^0-9]/g, '');

  if (!clean) {
    return `<span class="text-muted">—</span>`;
  }

  const isMobile = clean.length === 10 && clean.startsWith('05');

  if (showNumber) {
    // מצב הצגת מספר + וואטסאפ אם נייד
    const telLink = `<a href="tel:${clean}" class="phone-number">${raw}</a>`;
    if (isMobile) {
      const waNumber = '972' + clean.substring(1);
      const waLink = `https://wa.me/${waNumber}`;
      return `
        ${telLink}
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-icon" title="שלח הודעה בוואטסאפ ל-${raw}">
          <i class="fab fa-whatsapp"></i>
        </a>
      `;
    }
    return telLink;
  } else {
    // מצב אייקונים בלבד
    let icons = '';
    if (isMobile) {
      const waNumber = '972' + clean.substring(1);
      const waLink = `https://wa.me/${waNumber}`;
      icons = `
        <a href="tel:${clean}" class="phone-icon mobile" title="${raw} (נייד – לחץ לחיוג)">
          <i class="fas fa-mobile-screen"></i>
        </a>
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-icon" title="שלח הודעה בוואטסאפ ל-${raw}">
          <i class="fab fa-whatsapp"></i>
        </a>
      `;
    } else {
      icons = `
        <a href="tel:${clean}" class="phone-icon landline" title="${raw} (נייח – לחץ לחיוג)">
          <i class="fas fa-phone"></i>
        </a>
      `;
    }
    return icons;
  }
}

async function loadAndBuildAllLists() {
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.classList.add('active');

  const container = document.getElementById('dynamicListsContainer');
  if (!container) {
    console.error("לא נמצא dynamicListsContainer");
    if (loading) loading.classList.remove('active');
    return;
  }

  container.innerHTML = '';

  const sheetNames = await loadSheetNames();

  if (sheetNames.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">לא נמצאו טאבים</p>';
    if (loading) loading.classList.remove('active');
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const name of sheetNames) {
    const safeId = 'list-' + name.replace(/[^א-תa-zA-Z0-9]/g, '-');

    const btn = document.createElement('button');
    btn.className = 'collapsible-toggle mb-3';
    btn.dataset.target = safeId;
    btn.innerHTML = `
      <h3 class="mb-0 d-inline">${name}</h3>
      <i class="fas fa-chevron-down toggle-icon ms-2"></i>
    `;
    btn.addEventListener('click', () => toggleCollapsible(btn));

    const div = document.createElement('div');
    div.id = safeId;
    div.className = 'collapsible mb-4 collapsed';
    div.innerHTML = '<p class="text-muted text-center">טוען...</p>';

    fragment.appendChild(btn);
    fragment.appendChild(div);
  }

  container.appendChild(fragment);

  const loadPromises = sheetNames.map(async (name) => {
    const safeId = 'list-' + name.replace(/[^א-תa-zA-Z0-9]/g, '-');
    const targetDiv = document.getElementById(safeId);
    if (!targetDiv) return;

    try {
      const url = `${BASE_APPS_SCRIPT_URL}?type=${encodeURIComponent(name)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!Array.isArray(data) || data.length === 0) {
        targetDiv.innerHTML = '<p class="text-muted">אין נתונים בטאב זה</p>';
        return;
      }

      const headers = Object.keys(data[0]).filter(h => h.trim() !== '');

      // מצא את אינדקס עמודת "טלפון" אם קיימת
      const phoneColumnIndex = headers.findIndex(h => h.trim() === 'טלפון');
      const hasPhoneColumn = phoneColumnIndex !== -1;

      let thead = '<tr>';
      headers.forEach((header, idx) => {
        let thContent = header;
        if (idx === phoneColumnIndex) {
          thContent += `
            <span class="toggle-phone ms-2" data-state="hidden" title="לחץ להצגת/הסתרת מספרים">
              <i class="fas fa-eye-slash"></i>
            </span>
          `;
        }
        thead += `<th>${thContent}</th>`;
      });
      thead += '</tr>';

      let tbody = '';
      data.forEach(row => {
        let tr = '<tr>';
        headers.forEach((header, idx) => {
          const val = row[header] ?? '';
          let content = val;

          if (idx === phoneColumnIndex) {
            // השתמש במצב ברירת מחדל: hidden (אייקונים)
            content = createPhoneContent(val, false);
          } else {
            content = val || '';
          }

          tr += `<td>${content}</td>`;
        });
        tr += '</tr>';
        tbody += tr;
      });

      targetDiv.innerHTML = `
        <table class="collapsible-table" data-phone-col="${phoneColumnIndex}">
          <thead>${thead}</thead>
          <tbody>${tbody}</tbody>
        </table>
      `;

      // אם יש עמודה טלפון – הוסף מאזין לכפתור toggle
      if (hasPhoneColumn) {
        const toggleBtn = targetDiv.querySelector('.toggle-phone');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // שלא יסגור/יפתח את הקולפסיבל
            const state = toggleBtn.dataset.state;
            const newState = state === 'hidden' ? 'visible' : 'hidden';
            toggleBtn.dataset.state = newState;

            // שנה אייקון
            toggleBtn.innerHTML = newState === 'visible' 
              ? '<i class="fas fa-eye"></i>' 
              : '<i class="fas fa-eye-slash"></i>';

            // עדכן כל התאים בעמודה
            const table = targetDiv.querySelector('table');
            const colIndex = parseInt(table.dataset.phoneCol);
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
              const cell = row.children[colIndex];
              if (cell) {
                const originalValue = data[rowsIndex = Array.from(rows).indexOf(row)][headers[colIndex]] || '';
                cell.innerHTML = createPhoneContent(originalValue, newState === 'visible');
              }
            });
          });
        }
      }

    } catch (err) {
      console.error(`שגיאה בטעינת ${name}:`, err);
      targetDiv.innerHTML = '<p class="text-danger">שגיאה בטעינת הנתונים</p>';
    }
  });

  await Promise.all(loadPromises);

  if (loading) loading.classList.remove('active');
}

function toggleCollapsible(button) {
  const targetId = button.dataset.target;
  const target = document.getElementById(targetId);
  const icon = button.querySelector('.toggle-icon');

  if (!target || !icon) return;

  target.classList.toggle('collapsed');
  icon.classList.toggle('fa-chevron-down');
  icon.classList.toggle('fa-chevron-up');
}

// התחלה
loadAndBuildAllLists();
