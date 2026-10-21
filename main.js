const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const brl = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// navbar: fundo ao rolar, menu mobile e link ativo
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', open);
    navToggle.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
};
navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('header[id], section[id]').forEach((s) => sectionObserver.observe(s));

// contadores do hero
document.querySelectorAll('[data-count]').forEach((el) => {
    if (reduceMotion) return;
    const end = +el.dataset.count;
    const { prefix = '', suffix = '' } = el.dataset;
    const start = performance.now();
    const tick = (now) => {
        const p = Math.min((now - start) / 1600, 1);
        el.textContent = prefix + Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
});

// PDV demo: passa os itens, soma o total e autoriza a NFC-e, em loop
// alterna entre uma venda de supermercado e uma comanda de restaurante
const pdvScenes = [
    {
        title: '<i class="bi bi-cart-check"></i> PDV · Caixa 01',
        badge: 'NFC-e autorizada',
        items: [['Arroz tipo 1 5kg', 1, 27.9], ['Café torrado 500g', 2, 15.9], ['Leite integral 1L', 6, 5.99], ['Sabão em pó 1,6kg', 1, 18.5]],
    },
    {
        title: '<i class="bi bi-cup-hot"></i> Restaurante · Mesa 07',
        badge: 'Conta fechada · NFC-e autorizada',
        items: [['Baião de dois com carne de sol', 1, 38.9], ['Suco de cajá 500ml', 2, 9], ['Tapioca de queijo coalho', 1, 14], ['Pudim de leite', 2, 8.5]],
    },
];

async function runPdv() {
    const list = document.getElementById('pdvItems');
    const total = document.getElementById('pdvTotal');
    const nfce = document.getElementById('pdvNfce');
    const title = document.getElementById('pdvTitle');
    const badge = document.getElementById('pdvBadge');

    await wait(1800);
    for (let n = 0; ; n++) {
        const scene = pdvScenes[n % pdvScenes.length];
        title.innerHTML = scene.title;
        badge.textContent = scene.badge;
        // a venda anterior fica apagadinha até o primeiro item novo, para o card não ficar vazio
        list.querySelectorAll('li').forEach((li) => li.classList.add('old'));
        nfce.classList.add('pending');
        await wait(700);
        list.innerHTML = '';
        total.textContent = brl(0);

        let sum = 0;
        for (const [name, qty, price] of scene.items) {
            const li = document.createElement('li');
            li.className = 'in';
            li.innerHTML = `<span>${name}</span><span>${qty} × ${brl(price)}</span><b>${brl(qty * price)}</b>`;
            list.append(li);
            sum += qty * price;
            total.textContent = brl(sum);
            await wait(900);
        }
        await wait(600);
        nfce.classList.remove('pending');
        await wait(4500);
    }
}
if (!reduceMotion) runPdv();

// abas dos planos
const plansBox = document.querySelector('.plans');
const tabList = document.querySelector('.plan-tabs');
const tabs = [...tabList.querySelectorAll('[role="tab"]')];
const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

// contador de funções: os planos de DF-e a Avançado são cumulativos (MEI fica de fora)
let cumulative = 0;
tabs.slice(1).forEach((tab) => {
    const panel = panelOf(tab);
    const lis = [...panel.querySelectorAll('.features li')];
    cumulative += lis.length;
    lis.forEach((li, i) => li.style.setProperty('--i', i));
    const meta = document.createElement('div');
    meta.className = 'plan-meta';
    const includes = panel.querySelector('.plan-includes');
    if (includes) meta.append(includes);
    meta.insertAdjacentHTML('beforeend', `<span class="plan-count"><b data-n="${lis.length}">${lis.length}</b> funções novas · <b data-n="${cumulative}">${cumulative}</b> no total</span>`);
    panel.querySelector('.plan-head').after(meta);
});

// ícone do plano como marca d'água no fundo do card
tabs.forEach((tab) => panelOf(tab).insertAdjacentHTML('afterbegin', `<i class="plan-watermark ${tab.querySelector('i').className}" aria-hidden="true"></i>`));

// no celular as listas longas mostram 8 funções e um botão "Ver todas" (o CSS só esconde em telas pequenas)
document.querySelectorAll('.plan .features').forEach((ul) => {
    const total = ul.children.length;
    if (total <= 8) return;
    ul.classList.add('collapsed');
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'features-more';
    more.innerHTML = `Ver todas as ${total} funções <i class="bi bi-chevron-down"></i>`;
    more.addEventListener('click', () => {
        const open = ul.classList.toggle('collapsed');
        more.innerHTML = open ? `Ver todas as ${total} funções <i class="bi bi-chevron-down"></i>` : 'Mostrar menos <i class="bi bi-chevron-up"></i>';
    });
    ul.after(more);
});

const countUp = (panel) => {
    if (reduceMotion) return;
    panel.querySelectorAll('[data-n]').forEach((el) => {
        const end = +el.dataset.n, start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / 700, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
};

const selectTab = (tab) => {
    tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        panelOf(t).hidden = !on;
    });
    countUp(panelOf(tab));
    // no celular as abas rolam na horizontal: mantém a ativa à vista
    if (tabList.scrollWidth > tabList.clientWidth) tabList.scrollTo({ left: tab.offsetLeft - 16, behavior: 'smooth' });
};

// troca automática a cada 60s, puxada pela barra de progresso (CSS) da aba ativa
tabs.forEach((tab) => {
    const bar = document.createElement('span');
    bar.className = 'tab-progress';
    bar.addEventListener('animationend', () => selectTab(tabs[(tabs.indexOf(tab) + 1) % tabs.length]));
    tab.append(bar);
});
new IntersectionObserver(([e]) => plansBox.classList.toggle('paused', !e.isIntersecting)).observe(plansBox);

// busca: em qual plano a função aparece primeiro
const search = document.getElementById('planSearch');
const results = document.getElementById('planResults');
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const featureIndex = tabs.slice(1).flatMap((tab) =>
    [...panelOf(tab).querySelectorAll('.features li')].map((li) => ({ li, tab, text: li.textContent, key: norm(li.textContent) })));

const pick = (f) => {
    selectTab(f.tab);
    const ul = f.li.parentElement;
    if (ul.classList.contains('collapsed')) ul.nextElementSibling.click(); // abre a lista se a função estiver escondida
    f.li.classList.remove('hit');
    void f.li.offsetWidth; // reinicia a animação
    f.li.classList.add('hit');
    f.li.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    search.value = '';
    results.hidden = true;
};

// restaurante não está na lista dos planos: esses termos levam direto ao WhatsApp
const restaurantTerms = ['restaurante', 'delivery', 'entrega', 'motoboy', 'mesa', 'atendimento de mesas', 'mapa de mesas',
    'comanda', 'garcom', 'cardapio', 'pedido online', 'pedido por mesa', 'ifood', 'quero delivery', 'integracao',
    'link de delivery', 'link proprio', 'aplicativo de delivery', 'lanchonete', 'pizzaria', 'hamburgueria',
    'bar', 'boteco', 'cozinha', 'salao', 'taxa de servico', 'gorjeta', 'couvert', 'self-service', 'buffet', 'marmita',
    'marmitex', 'acaiteria', 'sorveteria', 'food', 'comida', 'refeicao', 'fechar conta', 'dividir conta', 'balcao'];
const isRestaurant = (q) => q.length >= 2 && restaurantTerms.some((t) => t.startsWith(q) || q.includes(t));

search.addEventListener('input', () => {
    const q = norm(search.value.trim());
    results.innerHTML = '';
    results.hidden = !q;
    if (!q) return;
    if (isRestaurant(q)) {
        results.insertAdjacentHTML('beforeend', `<li><a class="result-special" href="https://wa.me/558892361828?text=Ol%C3%A1!%20Quero%20o%20sistema%20para%20o%20meu%20restaurante." target="_blank" rel="noopener">
            <span><i class="bi bi-cup-hot"></i> Sistema para restaurantes: mesas, comandas e delivery sem taxa</span><small>Fale com a gente <i class="bi bi-whatsapp"></i></small></a></li>`);
    }
    const found = featureIndex.filter((f) => f.key.includes(q)).slice(0, 6);
    if (!found.length && !results.children.length) {
        results.innerHTML = '<li class="empty">Não encontramos essa função. <a href="https://wa.me/558892361828" target="_blank" rel="noopener">Pergunte no WhatsApp</a></li>';
        return;
    }
    found.forEach((f) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = `<span></span><small>a partir do plano <b>${f.tab.textContent.trim()}</b></small>`;
        btn.firstChild.textContent = f.text;
        btn.addEventListener('click', () => pick(f));
        li.append(btn);
        results.append(li);
    });
});
search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); results.querySelector('button')?.click(); }
    if (e.key === 'Escape') { search.value = ''; results.hidden = true; }
});
document.addEventListener('click', (e) => { if (!e.target.closest('.plan-search')) results.hidden = true; });
document.addEventListener('animationend', (e) => e.target.classList?.remove('hit'));

tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const next = tabs[(i + step + tabs.length) % tabs.length];
        selectTab(next);
        next.focus();
    });
});

// brilho que segue o cursor nos cards de soluções
document.querySelectorAll('.service').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--x', e.clientX - r.left + 'px');
        card.style.setProperty('--y', e.clientY - r.top + 'px');
    });
});

// calculadora de delivery: quanto o app cobra x link próprio sem taxa
// iFood: comissão + 3,2% de pagamento online; mensalidade quando as vendas passam de R$ 1.800 no mês
const IFOOD = { basico: { rate: 0.152, monthly: 110 }, entrega: { rate: 0.262, monthly: 150 } };
const calcOrders = document.getElementById('calcOrders');
const calcTicket = document.getElementById('calcTicket');
const calcRate = document.getElementById('calcRate');
const money = (n) => 'R$ ' + brl(n);

function calc() {
    const orders = +calcOrders.value, ticket = +calcTicket.value;
    const app = document.querySelector('input[name="calcApp"]:checked').value;
    const sales = orders * ticket;
    const plan = IFOOD[app] || { rate: Math.min(Math.max(+calcRate.value || 0, 0), 100) / 100, monthly: 0 };
    const fee = sales * plan.rate + (sales > 1800 ? plan.monthly : 0);

    document.getElementById('calcOrdersOut').textContent = orders.toLocaleString('pt-BR');
    document.getElementById('calcTicketOut').textContent = 'R$ ' + ticket;
    document.getElementById('calcSales').textContent = money(sales);
    document.getElementById('calcAppFee').textContent = money(fee);
    document.getElementById('calcYear').textContent = money(fee * 12);
    document.getElementById('calcFormula').textContent = `${money(fee)} de taxas por mês × 12 meses`;
}
const calcDialog = document.getElementById('calculadora');
calcDialog.addEventListener('input', calc);
// links para #calculadora abrem a janela; fecha no X, clicando fora ou com Esc (nativo do <dialog>)
document.querySelectorAll('a[href="#calculadora"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    calcDialog.showModal();
}));
calcDialog.querySelector('.calc-close').addEventListener('click', () => calcDialog.close());
calcDialog.addEventListener('click', (e) => { if (e.target === calcDialog) calcDialog.close(); });
calcRate.addEventListener('focus', () => { document.getElementById('calcAppOutro').checked = true; calc(); });
calc();

// imagem do "sobre nós" inclina seguindo o mouse
const aboutImg = document.getElementById('aboutImg');
if (!reduceMotion) {
    aboutImg.addEventListener('pointermove', (e) => {
        const r = aboutImg.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        aboutImg.style.setProperty('--px', (x - 0.5).toFixed(3));
        aboutImg.style.setProperty('--py', (y - 0.5).toFixed(3));
        aboutImg.style.setProperty('--gx', x * 100 + '%');
        aboutImg.style.setProperty('--gy', y * 100 + '%');
    });
    aboutImg.addEventListener('pointerleave', () => {
        aboutImg.style.setProperty('--px', 0);
        aboutImg.style.setProperty('--py', 0);
    });
}

// trilhas de circuito (o mesmo traço do logo) com pulsos de energia
function circuit(canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, traces, visible = true;

    function build() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        traces = Array.from({ length: Math.round(w / 55) }, () => {
            let x = Math.random() * w, y = h + 10;
            const pts = [[x, y]];
            const segs = 2 + Math.floor(Math.random() * 3);
            for (let s = 0; s < segs; s++) {
                const len = 40 + Math.random() * h * 0.25;
                if (s % 2) x += (Math.random() < 0.5 ? -1 : 1) * len * 0.7;
                y -= len;
                pts.push([x, y]);
            }
            const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
            return { pts, lens, length: lens.reduce((a, b) => a + b, 0), t: Math.random(), speed: 0.0015 + Math.random() * 0.003 };
        });
    }

    function pointAt(tr, d) {
        for (let i = 0; i < tr.lens.length; i++) {
            if (d <= tr.lens[i]) {
                const k = d / tr.lens[i], [x0, y0] = tr.pts[i], [x1, y1] = tr.pts[i + 1];
                return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
            }
            d -= tr.lens[i];
        }
        return tr.pts[tr.pts.length - 1];
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, '#1FD38A');
        grad.addColorStop(1, '#0597F2');

        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = grad;
        traces.forEach((tr) => {
            ctx.beginPath();
            tr.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
            const [ex, ey] = tr.pts[tr.pts.length - 1];
            ctx.beginPath();
            ctx.arc(ex, ey, 5, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.shadowColor = '#0597F2';
        ctx.shadowBlur = 12;
        traces.forEach((tr) => {
            const [x, y] = pointAt(tr, tr.t * tr.length);
            ctx.beginPath();
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    function loop() {
        if (visible) {
            traces.forEach((tr) => { tr.t = (tr.t + tr.speed) % 1; });
            draw();
        }
        requestAnimationFrame(loop);
    }

    build();
    draw();
    addEventListener('resize', () => { build(); draw(); });
    if (reduceMotion) return;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    loop();
}
document.querySelectorAll('.hero-circuit').forEach(circuit);
