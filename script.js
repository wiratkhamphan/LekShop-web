

  // ---------- Utils ----------
  const API_BASE = ENV.api; 
  const THB = n => `฿${Number(n||0).toLocaleString('th-TH')}`;
  function safeText(s){ return String(s ?? '').replace(/[<>&"]/g, m=>({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[m])); }
  function updateCartBadge(){
    const icon = document.getElementById('cart-icon');
    try{
      const cart = JSON.parse(localStorage.getItem('cart')||'[]');
      const total = cart.reduce((s,i)=> s + (Number(i.quantity)||0), 0);
      if (!icon) return;
      if (total>0) icon.setAttribute('data-count', total); else icon.removeAttribute('data-count');
    }catch(e){}
  }
  function attachAddToCart(root){
    root.querySelectorAll('.btn.add[data-id]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = Number(btn.dataset.price||0);

        if (typeof window.addToCart === 'function'){
          window.addToCart(id, name, price);
          updateCartBadge();
          return;
        }
        const cart = JSON.parse(localStorage.getItem('cart')||'[]');
        const i = cart.findIndex(x=>x.id===id);
        if (i>=0) cart[i].quantity = (cart[i].quantity||1)+1;
        else cart.push({id, name, price, quantity:1});
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
      });
    });
  }

  // ---------- Mobile menu ----------
  (function(){
    const btn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeMenu');
    const menu = document.getElementById('mobileMenu');
    if (btn && menu) btn.addEventListener('click', ()=> menu.style.display = 'block');
    if (closeBtn && menu) closeBtn.addEventListener('click', ()=> menu.style.display = 'none');
  })();

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', () => {

    updateCartBadge();  // sync badge ครั้งแรก
  });