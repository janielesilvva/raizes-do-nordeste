'use strict';
// Projeto Raízes do Nordeste

const produtos = [
  {id:'t1',name:'Tapioca de carne seca',price:24.90,image:'images/tapioca_carne_seca.jpg',desc:'Tapioca recheada com carne seca desfiada e queijo'},
  {id:'a1',name:'Acarajé',price:19.90,image:'images/acaraje.jpg',desc:'Especialidade baiana com recheio temperado'},
  {id:'m1',name:'Porção de mandioca frita',price:16.90,image:'images/mandioca_frita.jpg',desc:'Mandioca frita, dourada por fora e macia por dentro'},
  {id:'c1',name:'Suco de caju',price:9.90,image:'images/suco_caju.jpg',desc:'Suco de caju refrescante – 500 ml'},
  {id:'c2',name:'Suco de cajá',price:9.90,image:'images/suco_caja.jpg',desc:'Suco de cajá refrescante – 500 ml'}
];
const catalog = {
  centro: produtos.map(p=>({...p})),
  norte: produtos.map(p=>({...p,price:p.id==='c1'||p.id==='c2'?9.90:Number((p.price+1).toFixed(2))}))
};
const money=n=>n.toLocaleString('pt-BR', {
    style:'currency',currency:'BRL'
}
);
const initial= {
    unit:'centro',channel:'web',cart:[],view:'menu',user:null,consent:false,marketing:false,order:null,points:0,promo:'',paymentState:'idle'
}
;
const s= {
    ...initial
}
;
let failNext=false;
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"']/g,c=>( {
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}
[c]));
function toast(msg) {
    const el=$('toast');
    el.textContent=msg;
    el.style.display='block';
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>el.style.display='none',3200)
}
function button(label,action,cls='btn') {
    return `<button class="${cls}" data-action="${action}">${label}</button>`
}
function total() {
    let sum=s.cart.reduce((n,p)=>n+p.price*p.qty,0);
    return Math.max(0,sum-(s.promo==='RAIZES10'?sum*.1:0))
}
function setView(v) {
    s.view=v;
    render();
    window.scrollTo(0,0)
}
function render() {
    document.body.classList.toggle('totem',s.channel==='totem');
    const main=$('app');
    const intro=`<section class="hero"><h1>Sabores e tradições do Nordeste.</h1><p>Conheça nossos sabores regionais, escolha sua unidade e acompanhe seu pedido.</p><span class="pill">Demonstração: nenhuma cobrança é realizada</span></section>`;
        if(s.view==='menu') {
            main.innerHTML=intro+`<div class="desktop-layout"><section><div class="panel"><h2>Cardápio por unidade</h2><label class="field">Selecione a unidade<select id="unit"><option value="centro" ${s.unit==='centro'?'selected':''}>Centro</option><option value="norte" ${s.unit==='norte'?'selected':''}>Asa Norte</option></select></label><p class="muted small">Preços e disponibilidade ilustrativos; trocar de unidade limpa o carrinho.</p></div><div class="grid">${catalog[s.unit].map(p=>`<article class="panel product"><img class="product-image" src="${p.image}" alt="Foto ilustrativa de ${p.name}" loading="lazy"><h3>${p.name}</h3><p>${p.desc}</p><span class="price">${money(p.price)}</span>${button('Adicionar ao carrinho','add:'+p.id)}</article>`).join('')}</div></section><aside class="panel"><h2>Seu carrinho</h2>${cartHtml()}</aside></div>`
        }
        else if(s.view==='checkout') {
            main.innerHTML=`<h1>Finalizar pedido</h1><div class="desktop-layout"><section class="panel"><h2>Identificação</h2>${s.user?`<p>Olá, ${esc(s.user.name)}! ${button('Sair','logout','btn secondary')}</p>`:`<p>Cadastro e entrada simulados; seus dados não são enviados a servidores.</p><label class="field">Nome<input id="name" maxlength="60" autocomplete="name" placeholder="Seu nome"></label><label class="field">E-mail<input id="email" type="email" maxlength="100" autocomplete="email" placeholder="voce@exemplo.com"></label>${button('Cadastrar / entrar','login')}`}<h2>Privacidade</h2><label class="check"><input type="checkbox" id="necessary" ${s.consent?'checked':''}><span>Li o aviso de privacidade e compreendo o uso dos dados necessários para simular este pedido. <strong>Obrigatório para esta demonstração.</strong></span></label><label class="check"><input type="checkbox" id="marketing" ${s.marketing?'checked':''}><span>Aceito receber comunicações promocionais (opcional; não serão enviadas nesta demonstração).</span></label>${button('Ver aviso de privacidade','privacy','btn secondary')}<h2>Pagamento externo simulado</h2><label class="field">Forma de pagamento<select id="paymethod"><option>Pix (simulado)</option><option>Cartão (simulado)</option></select></label><p class="muted small">Não digite dados reais de cartão. O fluxo representa envio, espera e retorno de um provedor fictício.</p>${button('Simular aprovação','pay')}${button('Simular recusa','payfail','btn secondary')}<p id="payerror" class="error" role="alert"></p></section><aside class="panel"><h2>Resumo</h2>${cartHtml()}<p>Promoção RAIZES10: 10% de desconto em itens do carrinho.</p><label class="field">Cupom<input id="promo" placeholder="RAIZES10" value="${esc(s.promo)}"></label>${button('Aplicar cupom','promo','btn secondary')}</aside></div>`
        }
        else if(s.view==='orders') {
            main.innerHTML=`<h1>Acompanhar pedido</h1><section class="panel">${s.order?`<p>Pedido <strong>#${s.order.id}</strong> • Unidade ${s.order.unit==='centro'?'Centro':'Asa Norte'} • ${money(s.order.total)}</p><p class="success">Pagamento aprovado (simulação).</p><div class="steps">${['Recebido','Em preparo','Pronto para retirada','Retirado'].map((x,i)=>`<span class="step ${i<=s.order.status?'active':''}">${x}</span>`).join('')}</div><p>Estado atual: <strong>${['Recebido','Em preparo','Pronto para retirada','Retirado'][s.order.status]}</strong></p>${s.order.status<3?button('Avançar status (simulação)','advance'):'<p class="success">Pedido concluído. Obrigado!</p>'}`:`<p>Nenhum pedido confirmado ainda.</p>${button('Explorar cardápio','menu')}`}</section>`
        }
        else if(s.view==='loyalty') {
            main.innerHTML=`<h1>Clube Raízes</h1><section class="panel"><h2>${s.points} pontos</h2><p>Regra demonstrativa: a cada R$ 1,00 de pedido aprovado, ganhe 1 ponto inteiro. Os pontos são contabilizados uma vez por pedido e não têm valor monetário.</p><p>Benefício conceitual: 100 pontos podem habilitar um cupom de desconto em uma implementação futura.</p>${button('Ver cardápio','menu')}</section><section class="panel"><h2>Campanha</h2><p>Use o cupom <strong>RAIZES10</strong> para 10% de desconto neste protótipo.</p></section>`
        }
        else if(s.view==='privacy') {
            main.innerHTML=`<h1>Privacidade e LGPD</h1><section class="panel"><h2>Aviso de privacidade da demonstração</h2><p>Finalidade: identificar o pedido simulado, exibir seu andamento e, mediante escolha separada, registrar preferência de marketing. Dados coletados: nome e e-mail fornecidos voluntariamente, unidade, itens do carrinho e opção de consentimento.</p><p>Base legal proposta para o sistema real: execução de contrato ou procedimentos preliminares para o pedido; consentimento específico para marketing. A implementação real exigiria definição formal de controlador, canal de contato, prazos de retenção, política de segurança e exercício dos direitos dos titulares.</p><p>Neste protótipo os dados ficam somente na memória da aba, sem armazenamento permanente, cookies analíticos, envio de e-mail ou transferência a terceiros. Ao recarregar a página, os dados são descartados. Nenhum pagamento real ocorre.</p><p>Você pode recusar marketing sem perder a funcionalidade. Para apagar os dados simulados agora, use o botão abaixo.</p>${button('Apagar meus dados desta sessão','clear','btn danger')}${button('Voltar ao cardápio','menu','btn secondary')}</section>`
        }
        else main.innerHTML=intro;
    }
    function cartHtml() {
        return s.cart.length?`${s.cart.map(p=>`<div class="row"><span>${esc(p.name)}<br><small>${p.qty} × ${money(p.price)}</small></span><div class="actions">${button('−','minus:'+p.id,'btn secondary')}${button('+','add:'+p.id,'btn secondary')}</div></div>`).join('')}<p class="price">Total: ${money(total())}</p>${s.view==='menu'?button('Continuar para pagamento','checkout'):''}`:`<p class="muted">Seu carrinho está vazio.</p>`
    }
    function add(id) {
        const p=catalog[s.unit].find(p=>p.id===id);
        if(!p)return;
        const existing=s.cart.find(x=>x.id===id);
        if(existing)existing.qty++;
        else s.cart.push( {
            ...p,qty:1
        }
        );
        toast('Item adicionado ao carrinho');
        render()
    }
    function minus(id) {
        const p=s.cart.find(x=>x.id===id);
        if(!p)return;
        p.qty--;
        if(p.qty<=0)s.cart=s.cart.filter(x=>x.id!==id);
        render()
    }
    function login() {
        const name=$('name')?.value.trim(),email=$('email')?.value.trim();
        if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email||'')) {
            toast('Informe nome e e-mail válido.');
            return
        }
        s.user= {
            name,email
        }
        ;
        toast('Identificação simulada concluída');
        render()
    }
    function pay(reject) {
        s.consent=!!$('necessary')?.checked;
        s.marketing=!!$('marketing')?.checked;
        const error=$('payerror');
        if(!s.cart.length) {
            error.textContent='Adicione itens antes de pagar.';
            return
        }
        if(!s.user) {
            error.textContent='Cadastre-se ou entre antes de pagar.';
            return
        }
        if(!s.consent) {
            error.textContent='Leia e confirme o aviso de privacidade para continuar.';
            return
        }
        error.textContent='Enviando solicitação ao serviço externo simulado...';
        document.querySelectorAll('[data-action="pay"],[data-action="payfail"]').forEach(b=>b.disabled=true);
        s.paymentState='processing';
        setTimeout(()=> {
            if(reject) {
                s.paymentState='rejected';
                error.textContent='Pagamento recusado pelo provedor simulado. Tente novamente.';
                document.querySelectorAll('[data-action="pay"],[data-action="payfail"]').forEach(b=>b.disabled=false);
                return
            }
            s.paymentState='approved';
            s.order= {
                id:Math.floor(10000+Math.random()*90000),unit:s.unit,total:total(),status:0
            }
            ;
            s.points+=Math.floor(total());
            s.cart=[];
            s.promo='';
            toast('Pagamento simulado aprovado!');
            setView('orders')
        }
        ,650)
    }
    document.addEventListener('click',e=> {
        const b=e.target.closest('button');
        if(!b)return;
        if(b.dataset.view) {
            setView(b.dataset.view);
            return
        }
        if(b.dataset.channel) {
            s.channel=b.dataset.channel;
            render();
            return
        }
        const a=b.dataset.action;
        if(!a)return;
        if(a.startsWith('add:'))return add(a.slice(4));
        if(a.startsWith('minus:'))return minus(a.slice(6));
        if(['menu','checkout','orders','loyalty','privacy'].includes(a))return setView(a);
        if(a==='login')return login();
        if(a==='logout') {
            s.user=null;
            return render()
        }
        if(a==='pay'||a==='payfail')return pay(a==='payfail');
        if(a==='promo') {
            const code=$('promo').value.trim().toUpperCase();
            if(code!=='RAIZES10'&&code!=='') {
                toast('Cupom inválido');
                return
            }
            s.promo=code;
            toast(code?'Cupom aplicado':'Cupom removido');
            return render()
        }
        if(a==='advance'&&s.order) {
            s.order.status=Math.min(3,s.order.status+1);
            return render()
        }
        if(a==='clear') {
            Object.assign(s, {
                ...initial,cart:[]
            }
            );
            toast('Dados da sessão apagados');
            return render()
        }
    }
    );
    document.addEventListener('change',e=> {
        if(e.target.id==='unit') {
            s.unit=e.target.value;
            s.cart=[];
            s.promo='';
            toast('Unidade alterada; carrinho reiniciado.');
            render()
        }
    }
    );
    render();
