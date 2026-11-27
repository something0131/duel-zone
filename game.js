const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=540;
let selected=0,running=false,sound=true,time=60,last=0,roundKills={1:0,2:0};
const score={1:0,2:0};
const leaderboard=JSON.parse(localStorage.getItem('duelZoneLeaders')||'[]');
const maps=[
 {name:'NEON GRID',className:'neon',walls:[{x:270,y:170,w:150,h:28},{x:540,y:342,w:150,h:28},{x:466,y:210,w:28,h:120}]},
 {name:'CRATE YARD',className:'crates',walls:[{x:180,y:120,w:100,h:100},{x:680,y:320,w:100,h:100},{x:430,y:220,w:100,h:100},{x:430,y:340,w:100,h:28}]},
 {name:'CROSS FIRE',className:'cross',walls:[{x:430,y:0,w:100,h:170},{x:430,y:370,w:100,h:170},{x:170,y:256,w:180,h:28},{x:610,y:256,w:180,h:28}]}
];
const keys={};let bullets=[];
const player=(n,x,y,color)=>({n,x,y,r:17,vx:0,vy:0,color,hp:100,angle:n===1?0:Math.PI,cool:0,dash:0,reload:0,ammo:8});
let p1=player(1,100,H/2,'#42a5ff'),p2=player(2,W-100,H/2,'#ff4b68');

const mapCards=document.getElementById('mapCards');
maps.forEach((m,i)=>{const el=document.createElement('div');el.className='card'+(i===0?' active':'');el.innerHTML=`<div class="preview ${m.className}"></div><b>${m.name}</b><small>TACTICAL ARENA</small>`;el.onclick=()=>selectMap(i);mapCards.appendChild(el)});
function selectMap(i){selected=i;document.querySelectorAll('.card').forEach((e,n)=>e.classList.toggle('active',n===i));draw()}

addEventListener('keydown',e=>{keys[e.key.toLower();]=true;e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLower()]=false);
document.getElementById('startBtn').onclick=start;
document.getElementById('againBtn').onclick=start;
document.getElementById('menuBtn').onclick=()=>{document.getElementById('endScreen').classList.add('hidden');document.getElementById('menu').classList.remove('hidden')};
document.getElementById('soundBtn').onclick=e=>{sound=!sound;e.target.textContent='SOUND '+(sound?'ON':'OFF')};

function reset(){p1=player(1,100,H/2,'#42a5ff');p2=player(2,W-100,H/2,'#ff4b68');bullets=[];time=60;roundKills={1:0,2:0};document.getElementById('p1Score').textContent=score[1];document.getElementById('p2Score').textContent=score[2]}
function start(){reset();running=true;document.getElementById('menu').classList.add('hidden');document.getElementById('endScreen').classList.add('hidden');document.getElementById('mapName').textContent=maps[selected].name;last=performance.now();requestAnimationFrame(loop)}

function circleRect(c,r){for(const w of maps[selected].walls){const x=Math.max(w.x,Math.min(c.x,w.x+w.w)),y=Math.max(w.y,Math.min(c.y,w.y+w.h));if((c.x-x)**2+(c.y-y)**2<r*r)return true}return false}
function move(p,dx,dy){const nx=Math.max(p.r,Math.min(W-p.r,p.x+dx)),ny=Math.max(p.r,Math.min(H-p.r,p.y+dy));if(!circleRect({...p,x:nx,y:p.y},p.r))p.x=nx;if(!circleRect({...p,x:p.x,y:ny},p.r))p.y=ny}
function shoot(p){if(p.cool>0||p.reload>0)return;if(p.ammo<=0){p.reload=1.2;return}p.ammo--;p.cool=.22;bullets.push({x:p.x+Math.cos(p.angle)*22,y:p.y+Math.sin(p.angle)*22,vx:Math.cos(p.angle)*590,vy:Math.sin(p.angle)*590,from:p.n,life:1.1})}
function update(dt){
 const p1dx=(keys.d?1:0)-(keys.a?1:0),p1dy=(keys.s?1:0)-(keys.w?1:0);const p2dx=(keys.arrowright?1:0)-(keys.arrowleft?1:0),p2dy=(keys.arrowdown?1:0)-(keys.arrowup?1:0);
 [ [p1,p1dx,p1dy],[p2,p2dx,p2dy] ].forEach(([p,dx,dy])=>{const len=Math.hypot(dx,dy)||1;const speed=p.dash>0?780:190;move(p,dx/len*speed*dt,dy/len*speed*dt);if(dx||dy)p.angle=Math.atan2(dy/len,dx/len);p.cool-=dt;if(p.reload>0){p.reload-=dt;if(p.reload<=0)p.ammo=8}else if(p.ammo===0)p.reload=.01;p.dash-=dt});
 if(keys.q)shoot(p1);if(keys['/'])shoot(p2);if(keys.e&&p1.dash<=0)p1.dash=.12;if(keys['.']&&p2.dash<=0)p2.dash=.12;
 for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(circleRect(b,3)){b.life=0}for(const p of [p1,p2])if(b.from!==p.n&&Math.hypot(b.x-p.x,b.y-p.y)<p.r){b.life=0;p.hp-=20;hit(p)}}bullets=bullets.filter(b=>b.life>0&&b.x>0&&b.x<W&&b.y>0&&b.y<H);time-=dt;if(time<=0||p1.hp<=0||p2.hp<=0)endRound()
}
function hit(p){if(p.hp<=0)p.hp=0}
function endRound(){if(!running)return;running=false;let winner;p1.hp>p2.hp?winner=1:p2.hp>p1.hp?winner=2:winner=1;if(p1.hp===p2.hp)winner=roundKills[1]>=roundKills[2]?1:2;score[winner]++;const name=winner===1?'BLUE':'RED';document.getElementById('p1Score').textContent=score[1];document.getElementById('p2Score').textContent=score[2];document.getElementById('winner').textContent=name+' WINS';document.getElementById('endScreen').classList.remove('hidden');saveLeader(name)}
function saveLeader(name){const entry={name,score:score[name==='BLUE'?1:2],time:Date.now()};leaderboard.push(entry);leaderboard.sort((a,b)=>b.score-a.score);while(leaderboard.length>5)leaderboard.pop();localStorage.setItem('duelZoneLeaders',JSON.stringify(leaderboard));renderLeaderboard()}
function renderLeaderboard(){document.getElementById('leaderboard').innerHTML=leaderboard.map(e=>`<li>${e.name} — ${e.score}</li>`).join('')||'<li>No matches yet</li>'}renderLeaderboard();

function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#10142a';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(86,101,170,.13)';ctx.lineWidth=1;for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}const m=maps[selected];ctx.fillStyle='#252a4a';ctx.strokeStyle='#4d5684';ctx.lineWidth=3;for(const w of m.walls){ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeRect(w.x,w.y,w.w,w.h)}for(const b of bullets){ctx.fillStyle=b.from===1?'#89c9ff':'#ff92a4';ctx.beginPath();ctx.arc(b.x,b.y,5,0,7);ctx.fill()}drawPlayer(p1);drawPlayer(p2)}
function drawPlayer(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(8,-4,24,8);ctx.restore();ctx.fillStyle='#0a0c17';ctx.fillRect(p.x-23,p.y-31,46,5);ctx.fillStyle=p.color;ctx.fillRect(p.x-23,p.y-31,46*p.hp/100,5);ctx.fillStyle='#fff';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(p.ammo===0?'RELOADING':p.ammo,p.x,p.y+38)}
function loop(now){if(!running)return;const dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();document.getElementById('timer').textContent=Math.max(0,Math.ceil(time));if(running)requestAnimationFrame(loop)}
draw();
