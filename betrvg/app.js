"use strict";
(function(){
  const OFFICIAL="https://www.gesetze-im-internet.de/betrvg/";
  const $=id=>document.getElementById(id);
  let sections=[], map=new Map(), lastQuestion="", activeTab="search", toastTimer;
  let saved=loadSaved();
  const topicRules=[
    {phrases:["ueberstunden","mehrarbeit","arbeitszeit verlaengern","laenger arbeiten","stunden verlaengern","zusatzschicht"],refs:[["87","1","3"]],note:"Bei einer vorübergehenden Verlängerung oder Verkürzung der betriebsüblichen Arbeitszeit nennt § 87 Abs. 1 Nr. 3 ein Mitbestimmungsrecht. Die Einleitung zu Absatz 1 enthält einen Vorbehalt für gesetzliche und tarifliche Regelungen."},
    {phrases:["arbeitszeit","schichtplan","dienstplan","pausenregel","arbeitsbeginn","schichtwechsel","wochenplan"],refs:[["87","1","2"]],note:"§ 87 Abs. 1 Nr. 2 nennt Beginn und Ende der täglichen Arbeitszeit, Pausen und die Verteilung der Arbeitszeit auf die Wochentage. Beachte den Vorbehalt in Absatz 1."},
    {phrases:["urlaubsplan","urlaubswunsch","urlaubsgrundsaetze","urlaub genehmig","urlaub festleg","urlaubsregel"],refs:[["87","1","5"]],note:"§ 87 Abs. 1 Nr. 5 betrifft allgemeine Urlaubsgrundsätze, den Urlaubsplan und unter den dort genannten Voraussetzungen die zeitliche Lage des Urlaubs."},
    {phrases:["video ueberwachung","kameras","kamera","mitarbeiter ueberwachen","leistungskontrolle","zeiterfassungssystem","gps ueberwachung"],refs:[["87","1","6"]],note:"§ 87 Abs. 1 Nr. 6 nennt technische Einrichtungen, die dazu bestimmt sind, Verhalten oder Leistung der Arbeitnehmer zu überwachen."},
    {phrases:["arbeitsschutz","gesundheitsschutz","unfallverhuetung","sicherheit am arbeitsplatz"],refs:[["87","1","7"],["89","",""]],note:"§ 87 Abs. 1 Nr. 7 betrifft bestimmte Regelungen zur Unfallverhütung und zum Gesundheitsschutz. § 89 regelt weitere Aufgaben im Arbeits- und Umweltschutz."},
    {phrases:["homeoffice","mobile arbeit","mobiles arbeiten","remote arbeit"],refs:[["87","1","14"]],note:"§ 87 Abs. 1 Nr. 14 bezieht sich auf die Ausgestaltung mobiler Arbeit mittels Informations- und Kommunikationstechnik."},
    {phrases:["kuendigung","kuendigen","entlassen","entlassung","betriebsbedingte kuendigung"],refs:[["102","1",""],["102","2",""],["102","3",""]],note:"§ 102 enthält die Beteiligungsregeln des Betriebsrats bei Kündigungen, einschließlich Anhörung, Fristen und möglichem Widerspruch. Maßgeblich ist die jeweilige Art der Kündigung."},
    {phrases:["einstellung","einstellen","versetzung","umgruppierung","eingruppierung","personal einstellen"],refs:[["99","1",""],["99","2",""]],note:"§ 99 regelt Beteiligung und Zustimmungsverweigerungsgründe bei bestimmten personellen Einzelmaßnahmen. Beachte insbesondere die betrieblichen Voraussetzungen der Norm."},
    {phrases:["schulung","seminar","lehrgang","betriebsratsschulung","betriebsratsseminar","fortbildung fuer betriebsrat"],refs:[["37","6",""],["40","1",""]],note:"§ 37 Abs. 6 regelt bestimmte Schulungs- und Bildungsveranstaltungen; § 40 Abs. 1 behandelt die durch die Betriebsratstätigkeit entstehenden Kosten. Konkrete Reisekostenfragen sind nicht automatisch allein damit abschließend geklärt."},
    {phrases:["reisekosten","fahrtkosten","anreise","auto oder zug","kostenerstattung","erstattung","zugticket","fahrkarte","hotel kosten","uebernachtungskosten","dienstreise","kosten fuer betriebsrat"],refs:[["40","1",""],["37","6",""]],note:"§ 40 Abs. 1 bestimmt die Kostentragung für die Betriebsratstätigkeit. Für konkrete Reisemittel, Erstattungsumfang und Abrechnung können zusätzliche Regeln und Umstände entscheidend sein."},
    {phrases:["sachmittel","bueroausstattung","buero fuer betriebsrat","computer fuer betriebsrat","laptop fuer betriebsrat"],refs:[["40","2",""]],note:"§ 40 Abs. 2 nennt Räume, sachliche Mittel, Informations- und Kommunikationstechnik und Büropersonal im erforderlichen Umfang."},
    {phrases:["nicht informiert","information verweigert","auskunft verweigert","unterlagen bekommen","unterlagen verweigert","unterrichtungsrecht","informationen erhalten"],refs:[["80","2",""]],note:"§ 80 Abs. 2 behandelt die rechtzeitige und umfassende Unterrichtung sowie erforderliche Unterlagen zur Durchführung der Betriebsratsaufgaben."},
    {phrases:["betriebsratssitzung","tagesordnung","verschiedenes","einladung zur sitzung","sitzung einberufen","sitzung einladung"],refs:[["29","2",""],["30","",""],["33","",""]],note:"§ 29 betrifft die Einberufung und Tagesordnung der Betriebsratssitzung. Für Beschlüsse können zusätzlich §§ 30 und 33 wichtig sein."},
    {phrases:["beschlussfassung","abstimmung betriebsrat","beschlussfaehig","beschluss machen"],refs:[["33","",""],["34","",""]],note:"§ 33 enthält Regeln über Beschlüsse des Betriebsrats; § 34 betrifft die Sitzungsniederschrift."},
    {phrases:["sitzungsprotokoll","sitzungsniederschrift","protokoll betriebsrat"],refs:[["34","",""]],note:"§ 34 regelt die Sitzungsniederschrift und weitere Dokumentationspflichten."},
    {phrases:["ersatzmitglied","nachruecken","betriebsrat verhindert"],refs:[["25","",""]],note:"§ 25 regelt Ersatzmitglieder des Betriebsrats."},
    {phrases:["jav","jugend und auszubildendenvertretung","auszubildendenvertretung","azubi vertretung"],refs:[["67","",""],["60","",""],["70","",""]],note:"Die §§ 60, 67 und 70 regeln die Jugend- und Auszubildendenvertretung, ihre Aufgaben und die Teilnahme an Betriebsratssitzungen. Entscheidend sind die gesetzlichen Voraussetzungen."},
    {phrases:["geheimhaltung","betriebsgeheimnis","geschaeftsgeheimnis","vertrauliche information"],refs:[["79","",""]],note:"§ 79 regelt die Geheimhaltungspflichten und deren Grenzen."},
    {phrases:["datenschutz","personaldaten","daten verarbeiten","personenbezogene daten"],refs:[["79a","",""]],note:"§ 79a betrifft den Datenschutz im Zusammenhang mit Aufgaben des Betriebsrats. Weitergehende Datenschutzfragen lassen sich nicht allein aus dem BetrVG beantworten."},
    {phrases:["beschwerde","mitarbeiter beschwert","arbeitnehmer beschwert"],refs:[["84","",""],["85","",""]],note:"§§ 84 und 85 betreffen das Beschwerderecht der Arbeitnehmer und den Umgang mit Beschwerden durch den Betriebsrat."},
    {phrases:["betriebsversammlung","versammlung arbeitnehmer"],refs:[["42","",""],["43","",""],["44","",""]],note:"Die §§ 42 bis 44 regeln unter anderem Zusammensetzung, Durchführung und Zeitpunkt der Betriebsversammlung."},
    {phrases:["einigungsstelle","keine einigung","streit mit arbeitgeber"],refs:[["76","",""],["87","2",""]],note:"§ 76 regelt die Einigungsstelle. § 87 Abs. 2 betrifft ausdrücklich die Einigungsstelle bei fehlender Einigung in Angelegenheiten nach § 87 Abs. 1."},
    {phrases:["betriebsvereinbarung","vereinbarung mit arbeitgeber"],refs:[["77","",""],["88","",""]],note:"§ 77 regelt Betriebsvereinbarungen; § 88 nennt freiwillige Betriebsvereinbarungen."},
    {phrases:["wirtschaftsausschuss","wirtschaftliche angelegenheit","wirtschaftszahlen"],refs:[["106","",""],["107","",""]],note:"§§ 106 und 107 enthalten Regeln zum Wirtschaftsausschuss."},
    {phrases:["betriebsaenderung","personalabbau","massenentlassung","sozialplan","interessenausgleich","betrieb schliessen"],refs:[["111","",""],["112","",""]],note:"Die §§ 111 und 112 behandeln Betriebsänderungen, Interessenausgleich und Sozialplan. Es gelten unter anderem gesetzliche Schwellen und Voraussetzungen."},
    {phrases:["seeschifffahrt","seebetriebsrat","bordvertretung","auf see","schiffsbetrieb"],refs:[["114","",""],["115","",""],["116","",""]],note:"Die §§ 114 bis 116 enthalten Sondervorschriften für die Seeschifffahrt, Bordvertretungen und Seebetriebsräte."},
    {phrases:["ki einsetzen","kuenstliche intelligenz","software einfuehren","neue arbeitsverfahren","arbeitsplaetze planen"],refs:[["90","1","3"],["80","",""]],note:"§ 90 Abs. 1 nennt die Planung von Arbeitsverfahren und Arbeitsabläufen einschließlich des Einsatzes künstlicher Intelligenz. Weitere Normen können je nach Maßnahme relevant sein."},
    {phrases:["benachteiligt als betriebsrat","benachteiligung betriebsrat","behindert betriebsrat","betriebsrat bedroht"],refs:[["78","",""],["23","",""]],note:"§ 78 enthält Schutzbestimmungen für die Tätigkeit der gesetzlichen Interessenvertretungen; § 23 befasst sich mit der Verletzung gesetzlicher Pflichten."},
    {phrases:["freistellung","freigestellt als betriebsrat","arbeitsbefreiung"],refs:[["37","2",""],["38","",""]],note:"§§ 37 und 38 behandeln ehrenamtliche Betriebsratstätigkeit, erforderliche Arbeitsversäumnis und Freistellungen."},
    {phrases:["betriebsratswahl","wahlvorstand","waehlen betriebsrat","wahlberechtigt"],refs:[["1","",""],["7","",""],["16","",""]],note:"Die §§ 1, 7 und 16 enthalten grundlegende Vorschriften zur Errichtung und Wahl des Betriebsrats sowie zum Wahlvorstand."}
  ];
  const stopwords=new Set("also aber alle allem allen aller alles als auch auf aus bei beim bereits bist bitte da damit dann dass das dem den der des die dies diese dieser dieses doch dort du ein eine einen einer eines er es etwas euch fuer für hab habe haben hat hier ich ihr ihre im in ins ist ja kann koennen können kommt man mein meine meinen mit muss nach nicht noch nun nur oder ohne sein seine sich sie sind soll sollen so und uns unser unsere vom von vor was weil wenn wer werden wie wir wird wo zu zum zur".split(" "));
  const aliases=[["ueberstunden",["mehrarbeit","voruebergehende verlaengerung","betriebsueblichen arbeitszeit"]],["dienstplan",["arbeitszeit","verteilung"]],["schulung",["bildungsveranstaltung","fortbildung"]],["seminar",["bildungsveranstaltung"]],["kuendigung",["kuendigung","anhoerung"]],["urlaubsplan",["urlaub","urlaubsgrundsaetze"]],["reisespesen",["kosten","betriebsrat"]],["jav",["jugend","auszubildendenvertretung"]],["entlassung",["kuendigung"]],["homeoffice",["mobile arbeit"]]];
  function loadSaved(){try{return JSON.parse(localStorage.getItem("br_saved")||"[]")}catch{return []}}
  function persist(){try{localStorage.setItem("br_saved",JSON.stringify(saved))}catch{}}
  function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function normalize(value){return String(value??"").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim()}
  function terms(value){return [...new Set(normalize(value).split(" ").filter(x=>x.length>3&&!stopwords.has(x)))]}
  function cleanText(text){return String(text||"").replace(/[ \t]+/g," ").replace(/\s*\n\s*/g,"\n").replace(/\n{3,}/g,"\n\n").trim()}
  function xmlText(node){
    if(!node)return "";
    if(node.nodeType===3||node.nodeType===4)return node.nodeValue||"";
    if(node.nodeType!==1)return "";
    const tag=node.localName.toLowerCase();
    if(tag==="br")return "\n";
    let v=Array.from(node.childNodes).map(xmlText).join("");
    if(tag==="dt")v="\n"+v.trim()+" ";
    if(tag==="dd")v=v.trim()+"\n";
    if(tag==="p"||tag==="row"||tag==="div"||tag==="pre")v=v.trim()+"\n\n";
    return v;
  }
  function urlFor(id){return OFFICIAL+"__"+encodeURIComponent(id)+".html"}
  function formatRef(ref){return "§ "+ref[0]+(ref[1]?" Abs. "+ref[1]:"")+(ref[2]?" Nr. "+ref[2]:"")+" BetrVG"}
  function setStatus(text,klass){const n=$("status");n.className="status "+(klass||"");n.textContent=text}
  function notify(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)}
  function extractVersion(doc){
    const n=doc.getElementsByTagName("norm")[0];
    const metas=n&&n.getElementsByTagName("metadaten")[0];
    const comm=metas?Array.from(metas.getElementsByTagName("standkommentar")).map(x=>x.textContent):[];
    return comm.find(x=>/Zuletzt geaendert|Zuletzt geändert|geändert durch/i.test(x))||"Stand bitte im amtlichen Gesetz prüfen";
  }
  async function loadLaw(){
    try{
      const response=await fetch("betrvg.xml",{cache:"no-cache"});
      if(!response.ok)throw Error("HTTP "+response.status);
      const txt=await response.text();
      const doc=new DOMParser().parseFromString(txt,"application/xml");
      const parserError=doc.getElementsByTagName("parsererror")[0];
      if(parserError)throw Error("XML konnte nicht verarbeitet werden");
      const entries=Array.from(doc.getElementsByTagName("norm"));
      sections=entries.map(el=>{
        const meta=el.getElementsByTagName("metadaten")[0];
        if(!meta)return null;
        const rawId=meta.getElementsByTagName("enbez")[0]?.textContent?.trim()||"";
        const m=rawId.match(/^§\s*(\d+[a-z]?)/i);
        if(!m)return null;
        const title=meta.getElementsByTagName("titel")[0]?.textContent?.trim()||"Ohne Überschrift";
        const td=el.getElementsByTagName("textdaten")[0];
        const content=td?.getElementsByTagName("Content")[0];
        if(!content)return null;
        const paras=Array.from(content.children).filter(x=>x.localName.toLowerCase()==="p");
        return {id:m[1].toLowerCase(),title:title,content:content,paras:paras,text:cleanText(xmlText(content))};
      }).filter(Boolean);
      if(sections.length<125)throw Error("Nicht alle Paragraphen konnten geladen werden");
      map=new Map(sections.map(s=>[s.id,s]));
      const ver=extractVersion(doc);
      const lastChange=ver.match(/\b(\d{1,2}\.\d{1,2}\.\d{4})\b/);
      $("stand").textContent=lastChange?"Änderung: "+lastChange[1]:"Stand online prüfen";
      $("normcount").textContent=sections.length;
      $("sectionCount").textContent=sections.length+" Normen";
      $("legal-version").textContent="Gesetzesdaten: "+ver+". Abgleich mit der offiziellen Website bei wichtigen Entscheidungen erforderlich.";
      setStatus(sections.length+" Paragraphen geladen · Gesetzeswortlaut aus dem BetrVG · amtlicher Direktlink bei jedem Ergebnis.","");
      renderWelcome();
      renderBrowse();
      renderSaved();
      const hash=decodeURIComponent(location.hash.slice(1));
      const found=hash.match(/^par-(\d+[a-z]?)$/i);
      if(found&&map.has(found[1].toLowerCase()))showParagraph(found[1].toLowerCase());
    }catch(error){
      setStatus("Gesetzestext konnte nicht geladen werden. Bitte Internetverbindung prüfen oder das offizielle BetrVG öffnen.","error");
      $("results").innerHTML='<div class="empty">Die Suche ist zur Sicherheit gesperrt, solange der Originaltext nicht vollständig geladen wurde.<p><a href="'+OFFICIAL+'" target="_blank" rel="noopener noreferrer">Gesetz auf gesetze-im-internet.de öffnen ↗</a></p></div>';
      $("ask").disabled=true;
    }
  }
  function ruleHits(q){
    const nq=normalize(q), out=new Map();
    for(const rule of topicRules){
      const hits=rule.phrases.filter(p=>nq.includes(normalize(p)));
      if(!hits.length)continue;
      rule.refs.forEach((r,i)=>{
        if(!map.has(r[0]))return;
        const score=180+Math.min(45,hits.reduce((s,x)=>s+x.length,0)*2)-i*14;
        if(!out.has(r[0])||out.get(r[0]).score<score)out.set(r[0],{score,rule,ref:r});
      });
    }
    return out;
  }
  function searchLaw(question){
    const nt=normalize(question);
    const direct=(question.match(/(?:§|paragraph|paragraf)\s*(\d+[a-z]?)/i)||[])[1]?.toLowerCase();
    const wordList=terms(question);
    for(const [trigger,expansions] of aliases)if(nt.includes(trigger))expansions.forEach(e=>terms(e).forEach(x=>wordList.push(x)));
    const qterms=[...new Set(wordList)].slice(0,30);
    const preferred=ruleHits(question);
    const found=sections.map(s=>{
      const title=normalize(s.title),body=normalize(s.text);
      let score=0,matched=0;
      for(const t of qterms){
        if(title.includes(t)){score+=16;matched++}
        else if(body.includes(t)){score+=Math.min(7,2+t.length/5);matched++}
      }
      if(s.id===direct)score+=1000;
      if(preferred.has(s.id))score+=preferred.get(s.id).score;
      if(matched>1)score+=Math.min(20,matched*3);
      if(matched===0&&!preferred.has(s.id)&&s.id!==direct)score=0;
      return {section:s,score:score,preferred:preferred.get(s.id)||null};
    }).filter(x=>x.score>=7).sort((a,b)=>b.score-a.score||parseFloat(a.section.id)-parseFloat(b.section.id));
    if(!direct&&!preferred.size&&found.length&&found[0].score<13)return [];
    return found.slice(0,6);
  }
  function clauseSnippet(s,preferred,q){
    if(preferred){
      const ref=preferred.ref, abs=ref[1],nr=ref[2];
      let p=abs?s.paras.find(el=>el.textContent.trim().startsWith("("+abs+")")):null;
      if(nr){
        const candidates=p?[p]:s.paras;
        for(const c of candidates){
          const dt=Array.from(c.getElementsByTagName("DT")).find(x=>x.textContent.trim()===nr+".");
          if(dt&&dt.nextElementSibling&&dt.nextElementSibling.localName.toLowerCase()==="dd"){
            const lead=cleanText(c.firstChild?.nodeValue||"").slice(0,220);
            const item=cleanText(xmlText(dt)+xmlText(dt.nextElementSibling));
            return (lead?"("+abs+") "+lead.replace(/^\(\d+\)\s*/,"").trim()+"\n":"")+item;
          }
        }
      }
      if(p)return cleanText(xmlText(p)).slice(0,1150);
    }
    const t=terms(q);
    let best=s.paras[0],max=-1;
    for(const p of s.paras){
      const ptxt=normalize(p.textContent);
      const n=t.filter(word=>ptxt.includes(word)).length;
      if(n>max){max=n;best=p}
    }
    return cleanText(xmlText(best||s.content)).slice(0,1200);
  }
  function createCard(hit,query){
    const s=hit.section;
    const ref=hit.preferred?hit.preferred.ref:[s.id,"",""];
    const label=formatRef(ref),u=urlFor(s.id);
    const stored=saved.includes(s.id);
    const article=document.createElement("article");
    article.className="result-card";
    const detail=hit.preferred?.rule?.note||"Dieser Paragraph enthält möglicherweise eine für deine Frage relevante Regelung. Prüfe anhand des Originalwortlauts, ob die Voraussetzungen in deiner Situation erfüllt sind.";
    const excerpt=clauseSnippet(s,hit.preferred,query||s.title);
    article.innerHTML='<div class="card-top"><div><div class="section-label">Gesetzliche Fundstelle · BetrVG</div><h3>§ '+escapeHTML(s.id)+' BetrVG</h3><h4>'+escapeHTML(s.title)+'</h4></div><button class="save-btn '+(stored?'saved':'')+'" type="button" data-save="'+escapeHTML(s.id)+'" aria-label="'+(stored?'Aus Merkliste entfernen':'Paragraph merken')+'" title="Merken">'+(stored?'★':'☆')+'</button></div>'+
      '<div class="ref-line"><span class="ref-badge">'+escapeHTML(label)+'</span></div>'+
      '<div class="explain"><strong>Einfach erklärt · Orientierung</strong><p>'+escapeHTML(detail)+'</p></div>'+
      '<div class="lawquote"><strong>Originalwortlaut – relevanter Auszug</strong>'+escapeHTML(excerpt)+'</div>'+
      '<details class="detail"><summary>Vollständigen Gesetzestext des § '+escapeHTML(s.id)+' anzeigen</summary><div class="full-law">'+escapeHTML(s.text||"(Kein Wortlaut vorhanden)")+'</div></details>'+
      '<div class="card-footer"><a class="source-link" href="'+u+'" target="_blank" rel="noopener noreferrer">§ '+escapeHTML(s.id)+' im amtlichen BetrVG nachschlagen ↗</a><button class="copy" type="button" data-copy="'+escapeHTML(s.id)+'">Fundstelle kopieren</button></div>';
    return article;
  }
  function renderWelcome(){
    if(lastQuestion)return;
    $("results").innerHTML='<div class="how-card"><strong>So funktioniert’s</strong><p style="color:#5a6f87;font-size:13px;margin-bottom:0">Schreibe deine Frage oben hinein oder tippe auf ein Beispielthema. Du erhältst Fundstellen mit <strong>Originaltext</strong>, einem nachprüfbaren <strong>§-Verweis</strong> und einem Link zur amtlichen Fassung. Für komplexe Fälle reicht eine Stichwortsuche möglicherweise nicht aus.</p></div>';
  }
  function renderHits(question,hits){
    const el=$("results");el.replaceChildren();
    const head=document.createElement("div");head.className="results-head";
    head.innerHTML='<h2>Passende Fundstellen</h2><span>'+(hits.length?hits.length+" Treffer ausgewählt":"Kein sicherer Treffer")+'</span>';
    el.append(head);
    if(!hits.length){
      const empty=document.createElement("div");
      empty.className="empty";
      empty.innerHTML='<strong>Keine ausreichend eindeutige Fundstelle gefunden.</strong><p>Formuliere dein Problem genauer oder suche direkt nach einer Paragraphennummer. Das bedeutet nicht, dass es keine rechtliche Regelung gibt. Möglicherweise liegt sie außerhalb des BetrVG.</p><a href="'+OFFICIAL+'" target="_blank" rel="noopener noreferrer">Gesamtes BetrVG nachschlagen ↗</a>';
      el.append(empty);
    }else{
      const note=document.createElement("div");note.className="status warn";
      note.textContent="Suchtreffer, keine automatische Einzelfallprüfung. Bitte Originaltext und Voraussetzungen beachten.";
      el.append(note);
      hits.forEach(hit=>el.append(createCard(hit,question)));
    }
  }
  function ask(text){
    if(!sections.length){notify("Der Gesetzestext ist noch nicht geladen.");return}
    const question=(text||$("question").value).trim();
    if(question.length<4){notify("Bitte beschreibe deine Situation etwas genauer.");return}
    switchTab("search");
    const followup=/^(und\b|aber\b|was ist\b|gilt das\b|wie ist\b|wenn\b|was passiert\b)/i.test(question);
    const effective=followup&&lastQuestion?lastQuestion.slice(0,180)+" "+question:question;
    lastQuestion=effective;
    $("conversation").innerHTML='<div class="question-bubble"><div>'+escapeHTML(question)+'</div></div>';
    renderHits(effective,searchLaw(effective));
    $("results").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function showParagraph(id){
    const s=map.get(id);
    if(!s)return;
    switchTab("search");
    $("conversation").innerHTML="";
    $("results").replaceChildren();
    $("results").append(createCard({section:s,score:1000,preferred:null},""));
    $("results").scrollIntoView({behavior:"smooth",block:"start"});
    history.replaceState(null,"","#par-"+id);
  }
  function renderBrowse(filter=""){
    const list=$("law-list");list.replaceChildren();
    const q=normalize(filter);
    const shown=sections.filter(s=>!q||normalize("§ "+s.id+" "+s.title+" "+s.text.slice(0,180)).includes(q)).slice(0,180);
    for(const s of shown)list.append(makeRow(s));
    if(!shown.length)list.innerHTML='<div class="empty">Keine passenden Paragraphen gefunden.</div>';
    $("sectionCount").textContent=(filter?shown.length+" gefunden · ": "")+sections.length+" Normen";
  }
  function makeRow(s){
    const btn=document.createElement("button");btn.type="button";btn.className="law-row";
    btn.innerHTML='<span class="row-num">§ '+escapeHTML(s.id)+'</span><span class="row-title">'+escapeHTML(s.title)+'</span><span class="arrow">›</span>';
    btn.addEventListener("click",()=>showParagraph(s.id));
    return btn;
  }
  function renderSaved(){
    const list=$("saved-list");list.replaceChildren();
    saved.map(id=>map.get(id)).filter(Boolean).forEach(s=>list.append(makeRow(s)));
    if(!list.childElementCount)list.innerHTML='<div class="empty">Noch keine Paragraphen gemerkt. Tippe bei einem Ergebnis auf ☆, um es hier zu speichern.</div>';
  }
  function switchTab(tab){
    activeTab=tab;
    $("browse").classList.toggle("hidden",tab!=="browse");
    $("saved").classList.toggle("hidden",tab!=="saved");
    $("about").classList.toggle("hidden",tab!=="about");
    const search=tab==="search";
    $("start").classList.toggle("hidden",!search);
    $("conversation").classList.toggle("hidden",!search);
    $("results").classList.toggle("hidden",!search);
    $("status").classList.toggle("hidden",!search);
    document.querySelectorAll(".nav").forEach(el=>{const selected=el.dataset.tab===tab;el.classList.toggle("active",selected);el.setAttribute("aria-current",selected?"page":"false")});
    if(tab==="saved")renderSaved();
    if(tab==="browse")renderBrowse($("filter").value);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>{$("question").value=b.dataset.q;ask(b.dataset.q)}));
  $("ask").addEventListener("click",()=>ask());
  $("question").addEventListener("keydown",e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask()}});
  $("filter").addEventListener("input",e=>renderBrowse(e.target.value));
  document.addEventListener("click",async event=>{
    const save=event.target.closest("[data-save]");
    if(save){
      const id=save.dataset.save;
      if(saved.includes(id))saved=saved.filter(x=>x!==id);
      else saved=[...saved,id];
      persist();
      save.classList.toggle("saved",saved.includes(id));
      save.textContent=saved.includes(id)?"★":"☆";
      save.setAttribute("aria-label",saved.includes(id)?"Aus Merkliste entfernen":"Paragraph merken");
      notify(saved.includes(id)?"§ "+id+" gemerkt":"§ "+id+" entfernt");
      renderSaved();
      return;
    }
    const copy=event.target.closest("[data-copy]");
    if(copy){
      const id=copy.dataset.copy,s=map.get(id);
      const v="§ "+id+" BetrVG – "+(s?.title||"")+"\n"+urlFor(id);
      try{await navigator.clipboard.writeText(v);notify("Fundstelle kopiert.")}catch{notify("Kopieren ist im Browser nicht möglich. Nutze den amtlichen Link.")}
    }
  });
  loadLaw();
})();