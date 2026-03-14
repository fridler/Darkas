
const BASE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXTIinrxAP9eVk8Bh5sh-sk-841nAe_yL2xhpLsB0ZHa6MJJI-AsFe2ntZC2kU54NV/exec';

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
   listElement.innerHTML = `
     <table class="collapsible-table">
       <thead>
         <tr>
           <th>שם</th>
           <th>טלפון</th>
         </tr>
       </thead>
       <tbody>
         ${data.map(item => `
           <tr>
             <td>${item.name || ''}</td>
             <td class="phone-cell">
               ${item.phone ? `<a href="tel:${(item.phone || '').replace(/[^0-9]/g, '')}">${item.phone}</a>` : ''}
             </td>
           </tr>
         `).join('')}
       </tbody>
     </table>
   `;
 } catch (error) {
   console.error(`שגיאה בטעינת ${type}:`, error);
   document.getElementById('errorMessage').classList.remove('d-none');
 }
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
     loadCollapsible('חמל גדוד+פלוגות', 'hamalGdod')
   ]);
 } catch (error) {
   console.error('שגיאה כללית ב-loadAllData:', error);
 } finally {
   if (loadingOverlay) loadingOverlay.classList.remove('active');
 }
}

loadAllData();
