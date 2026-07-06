'use strict';
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const code=src.match(/<script>([\s\S]*)<\/script>/)[1];

function makeEl(){
  const el={
    style:{}, dataset:{}, children:[], _html:'', _text:'',
    classList:{add(){},remove(){},contains(){return false}},
    addEventListener(){}, appendChild(c){this.children.push(c)},
    offsetWidth:100, offsetHeight:80, clientWidth:1200, clientHeight:800,
    hidden:false, disabled:false,
    getContext:function(){return ctx},
    setAttribute(){}, getAttribute(){return null}, click(){},
  };
  Object.defineProperty(el,'innerHTML',{get(){return this._html},set(v){this._html=v;this.children=[]}});
  Object.defineProperty(el,'textContent',{get(){return this._text},set(v){this._text=v}});
  return el;
}
const ctxCalls={stroke:0,fill:0};
const ctx=new Proxy({},{get:(t,p)=>{
  if(p==='stroke')return()=>{ctxCalls.stroke++};
  if(p==='fill')return()=>{ctxCalls.fill++};
  if(p==='createRadialGradient'||p==='createLinearGradient')return()=>({addColorStop(){}});
  return typeof p==='string'?()=>{}:undefined;
},set:()=>true});
global.__ctxCalls=ctxCalls;
const cvEl=makeEl(); cvEl.getContext=()=>ctx; cvEl.width=0; cvEl.height=0;
const els={cv:cvEl};
global.document={
  getElementById:id=>{ if(!els[id])els[id]=makeEl(); return els[id]; },
  createElement:()=>makeEl(),
};
global.window={addEventListener(){},devicePixelRatio:2};
global.Path2D=class{constructor(){this.n=0}moveTo(){this.n++}arc(){this.n++}lineTo(){this.n++}quadraticCurveTo(){this.n++}ellipse(){this.n++}};
global.__raf=null;
global.requestAnimationFrame=fn=>{global.__raf=fn};

const tests=`
;(function(){
  const assert=(c,m)=>{if(!c)throw new Error('ASSERT: '+m)};
  console.log('init: positions',G.S.size,'layout',LY.order.length,'redundant',LY.redundant.length,
    'treeGroups',scene.tree.length,'gold',scene.gold.length);
  console.log('ringR:',LY.ringR.map(r=>r.toFixed(2)).join(','));
  assert(LY.order.length===5478,'layout covers all positions');
  assert(scene.gold.length===0,'golden vine hidden at empty board, got '+scene.gold.length);
  const byD={}; for(const o of LY.order){(byD[o.d]=byD[o.d]||[]).push(o);}
  for(let d=1;d<=LY.maxD;d++){
    const ring=byD[d], N=ring.length;
    const angs=ring.map(o=>o.ang).sort((a,b)=>a-b);
    for(let i=1;i<N;i++){
      const gap=angs[i]-angs[i-1];
      assert(Math.abs(gap-2*Math.PI/N)<1e-9,'ring '+d+' uneven at '+i+': '+gap);
    }
    const slot=2*Math.PI*LY.cum[d]/N;
    assert(LY.ringR[d]<=slot*0.42+1e-9,'ring '+d+' petals too big');
  }
  console.log('rings evenly spaced, petals fit slots');
  dirty=true; __raf(1000); console.log('draw ok: strokes',__ctxCalls.stroke,'fills',__ctxCalls.fill);

  for(const i of [0,3,1,4]){
    const e=childEdgeForCell(i);
    assert(e,'edge for cell '+i);
    trail.push({key:e.to.key,cell:i}); setFocus(e.to);
  }
  assert(focus.key==='XX.OO....','nav: '+focus.key);
  assert(scene.gold.length===1,'gold blooms after moves, got '+scene.gold.length);
  console.log('nav ok:',focus.key,'subtree',LY.order.length,'games',focus.games,'gold',scene.gold.length);

  setFold(true);
  assert(G.S.size===765,'fold positions '+G.S.size);
  assert(scene.gold.length===0,'gold hidden at folded root');
  const e1=childEdgeForCell(8); assert(e1,'fold: corner move edge');
  trail.push({key:e1.to.key,cell:8}); setFocus(e1.to);
  assert(scene.gold.length===4,'fold: vine 4 segments after 1 move, got '+scene.gold.length);
  hover=LY.order[3]; updateTip();
  assert(!document.getElementById('tip').hidden,'tooltip shows');
  goHome(); goUp();
  assert(focus===G.root&&trail.length===0,'back at root');
  dirty=true; __raf(2000);
  setFold(false);
  assert(G.S.size===5478,'unfold restores full graph');
  assert(typeof goSketch==='undefined','sketch button fully removed');
  // fate tint batching: every node group carries a minimax value
  assert(scene.nodes.every(g=>[1,0,-1].includes(g.val)),'node groups carry fate values');
  // unified players: watch mode reaches an ending, interrupt restores control
  goHome(); setPlayers('X','random'); setPlayers('O','bot');
  let wguard=0;
  while(!focus.win&&wguard++<20){ agentMove(players[focus.depth%2===0?'X':'O']); }
  assert(focus.win&&focus.win!=='X','bot O never loses in watch mode, ended '+focus.win);
  humanInterrupt();
  assert(players.X==='you'&&players.O==='you','interrupt hands both sides back');
  // preview text for a winning move
  goToCells([0,3,1,4]);
  const pe=childEdgeForCell(2);
  assert(previewText(2,pe.to).includes('wins'),'preview announces the win');
  // tour
  tourGo(1);
  assert(focus===G.root&&tourIdx===0,'tour stop 1 = empty board');
  tourGo(1); tourGo(1);
  assert(focus.depth===2,'tour stop 3 at move 2, got depth '+focus.depth);
  tourGo(-1);
  assert(focus.depth===1,'tour back to stop 2');
  for(let i=0;i<4;i++)tourGo(1);
  assert(focus.win==='X','tour final stop is a finished X win, got '+focus.win);
  // the random agent runs a game to an ending
  goHome();
  let guard=0;
  while(!focus.win&&guard++<20){ randomMove(); }
  assert(focus.win,'random play reached an ending: '+focus.key);
  // goToCells + recenter
  goToCells([4,0,8]);
  assert(focus.depth===3&&trail.length===3,'goToCells lands at move 3');
  view.ox=99999; clampView();
  assert(view.ox<99999,'pan clamp engages');
  recenter(); __raf(3000); __raf(3700);
  assert(recAnim===null||Math.abs(view.scale-1)<0.01,'recenter settles');
  console.log('tour/autoplay/clamp/recenter ok');
  // minimax sanity
  assert(G.root.val===0,'perfect play is a draw, root val '+G.root.val);
  assert(G.root.md===9,'optimal draw runs 9 moves, got '+G.root.md);
  // bot answers a center opening with a corner
  goToCells([4]); botMove();
  assert(focus.depth===2,'bot replied');
  assert([0,2,6,8].includes(trail[1].cell),'perfect reply to center is a corner, got '+trail[1].cell);
  // bot never loses, either side, vs 60 random opponents each
  function randMove(){
    const e=focus.children[Math.floor(Math.random()*focus.children.length)];
    trail.push({key:e.to.key,cell:e.cell}); setFocus(e.to);
  }
  let botWinsO=0;
  for(let g=0;g<60;g++){
    goHome();
    while(!focus.win){ if(focus.depth%2===0)randMove(); else botMove(); }
    assert(focus.win!=='X','bot as O never loses; lost game '+g);
    if(focus.win==='O')botWinsO++;
  }
  let botWinsX=0;
  for(let g=0;g<60;g++){
    goHome();
    while(!focus.win){ if(focus.depth%2===0)botMove(); else randMove(); }
    assert(focus.win!=='O','bot as X never loses; lost game '+g);
    if(focus.win==='X')botWinsX++;
  }
  console.log('bot ok: as O won '+botWinsO+'/60, as X won '+botWinsX+'/60, lost 0');
  // redo stack
  goToCells([4,0]);
  goUp();
  assert(focus.depth===1&&redoStack.length===1,'goUp feeds redo');
  goForward();
  assert(focus.depth===2&&trail.length===2&&redoStack.length===0,'goForward replays the move');
  goUp(); goToCells([0]);
  assert(redoStack.length===0,'fresh navigation clears redo');
  console.log('redo ok');
  goHome();
  console.log('SMOKE TEST PASSED');
})();
`;
eval(code+tests);
