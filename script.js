
const BASE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6s-5asWdDA0AWwg5lVcgAQh58zZ4O_swh1V9iG1aJ45pYQo4Mq733UkaQi9Zm_zBI/exec';

async function loadCollapsible(type, listId) {
  const listElement = document.getElementById(listId);
  if (!listElement) {
    console.warn(`לא נמצא אלמנט עם ID: ${listId} עבור ${type}`);
    return;
  }

  const toggleButton = document.querySelector(`button[data-list="${listId}"]`);
  if (!toggleButton) {
    console.warn(`לא נמצא כפתור toggle עבור ${listId}`);
    return;
  }

  try {
    const url = `${BASE_APPS_SCRIPT_URL}?type=${encodeURIComponent(type)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} עבור ${type}`);
    }
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      toggleButton.classList.add('d-none');
      listElement.innerHTML = '';
      return;
    }

    toggleButton.classList.remove('d-none');

    // לוקחים את שמות העמודות מהאובייקט הראשון (שורה 1 בגליון)
    const firstItem = data[0];
    const headers = Object.keys(firstItem).filter(key => key.trim() !== ''); // מסננים ריקים

    // בניית כותרות הטבלה
    let thead = '<tr>';
    headers.forEach(header => {
      thead += `<th>${header}</th>`;
    });
    thead += '</tr>';

    // בניית שורות הגוף
    let tbody = '';
    data.forEach(item => {
      let row = '<tr>';
      headers.forEach(header => {
        const value = item[header] ?? '';
        // טיפול מיוחד בעמודות שמכילות "טלפון" או "phone" בשם
        if (header.toLowerCase().includes('טלפון') || header.toLowerCase().includes('phone')) {
          const rawPhone = value.trim();
          const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
          let telLink = '';
          let whatsappLink = '';

          if (cleanPhone) {
            telLink = `<a href="tel:${cleanPhone}">${rawPhone}</a>`;

            // אם מתחיל ב-05 (נייד) – מוסיפים וואטסאפ
            if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
              const waNumber = '972' + cleanPhone.substring(1);
              whatsappLink = `
                <a href="https://wa.me/${waNumber}" target="_blank" rel="noopener noreferrer" class="whatsapp-icon" title="שלח הודעה בוואטסאפ">
                  <i class="fab fa-whatsapp"></i>
                </a>
              `;
            }
          }
          row += `<td class="phone-cell">${telLink}${whatsappLink}</td>`;
        } else {
          // עמודות רגילות – טקסט בלבד
          row += `<td>${value}</td>`;
        }
      });
      row += '</tr>';
      tbody += row;
    });

    listElement.innerHTML = `
      <table class="collapsible-table">
        <thead>
          ${thead}
        </thead>
        <tbody>
          ${tbody}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error(`שגיאה בטעינת ${type}:`, error);
    document.getElementById('errorMessage')?.classList.remove('d-none');
  }
}

function createPhoneLink(phone) {
  if (!phone) return '';

  // מנקה את המספר מכל תווים לא ספרתיים
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  // בודק אם זה מספר ישראלי נייד (מתחיל ב-05 ולאחר ניקוי 10 ספרות)
  const isMobile = /^05[0-9]{8}$/.test(cleanPhone);

  // קישור טלפון (אפשר להשתמש בפורמט בינלאומי גם פה אם רוצים)
  const telLink = `<a href="tel:${cleanPhone}" class="phone-number">${phone}</a>`;

  if (isMobile) {
    // המרה לפורמט בינלאומי ללא סימן '+' (wa.me דורש ללא '+')
    const intlWithoutPlus = '972' + cleanPhone.slice(1); // למשל 0506666666 -> 972506666666
    const whatsappLink = `https://wa.me/${intlWithoutPlus}`;

    return `
      ${telLink}
      <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-icon" title="שלח הודעה בוואטסאפ">
        <i class="fab fa-whatsapp"></i>
      </a>
    `;
  }

  // אם לא נייד — רק קישור טלפון רגיל
  return telLink;
}

function toggleCollapsible(button) {
 const listId = button.getAttribute('data-list');
 const list = document.getElementById(listId);
 const icon = button.querySelector('.toggle-icon');

 if (!list || !icon) {
   console.warn(`לא ניתן למצוא list או icon עבור ${listId}`);
   return;
 }

 list.classList.toggle('collapsed');
 if (list.classList.contains('collapsed')) {
   icon.classList.remove('fa-chevron-up');
   icon.classList.add('fa-chevron-down');
 } else {
   icon.classList.remove('fa-chevron-down');
   icon.classList.add('fa-chevron-up');
 }
}

async function loadAllData() {
 const loadingOverlay = document.getElementById('loadingOverlay');
 if (loadingOverlay) loadingOverlay.classList.add('active');

 try {
   await Promise.all([
     loadCollapsible('קודקודים', 'kodkodsPhones'),
     loadCollapsible('רבשצים', 'ravshatzim'),
     loadCollapsible('חמלים איסוף', 'hamalIsuf'),
     loadCollapsible('חמלים ישובים', 'hamalYeshuvim'),
     loadCollapsible('חטיבה', 'hativa'),
     loadCollapsible('חמל גדוד+פלוגות', 'hamalGdod'),
     loadCollapsible('בעלי תפקידים', 'baliTafkidimPhones'),
   ]);
 } catch (error) {
   console.error('שגיאה כללית ב-loadAllData:', error);
 } finally {
   if (loadingOverlay) loadingOverlay.classList.remove('active');
 }
}

loadAllData();
