// ChatGPT-specific observation vocabulary for the existing Studio Craft accessibility reader.
// Fixed semantic labels are candidates, never locators, grants, or executable operations.
// No private field values, arbitrary labels, user content, selectors, or AX identifiers leave this reducer.
export const CHATGPT_SURFACE_GROUPS = Object.freeze([
 ['CG01','shell-navigation'],['CG02','history-search'],['CG03','conversation-lifecycle'],
 ['CG04','composer-attachments'],['CG05','responses-artifacts'],['CG06','model-reasoning'],
 ['CG07','projects'],['CG08','settings'],['CG09','memory-personalization'],
 ['CG10','plugins-active-tools'],['CG11','plugin-consent-connection'],['CG12','work-tasks'],
 ['CG13','library-files'],['CG14','account-session'],['CG15','errors-notifications'],
 ['CG16','voice-media'],['CG17','sharing-management'],['CG18','keyboard-accessibility'],
 ['CG19','responsive-layouts'],['CG20','unknown-reachable-states'],
].map(([id,name])=>Object.freeze({id,name})));
const roles=new Set(['button','link','menu','menubar','menuitem','menuitemcheckbox','menuitemradio','tab','tablist','dialog','alertdialog','combobox','listbox','option','checkbox','radio','switch','textbox','searchbox','slider','spinbutton','tree','treeitem','navigation','toolbar']);
const stateNames=new Set(['disabled','expanded','checked','selected','pressed','required','readonly','focused','hasPopup']);
const normalize=s=>String(s).trim().normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,' ');
const aliases=[
 ['CG01','sidebar',['Open sidebar','Close sidebar','Toggle sidebar','Abrir barra lateral','Cerrar barra lateral','Barra lateral'],['button','menuitem']],
 ['CG01','home',['Home','Inicio','ChatGPT'],['link','button']],
 ['CG02','history',['Chat history','History','Historial de chats','Historial'],['button','link','navigation','menuitem']],
 ['CG02','search',['Search chats','Search conversations','Buscar chats','Buscar conversaciones'],['button','searchbox','menuitem']],
 ['CG03','new-chat',['New chat','Nuevo chat','Nuevo ChatGPT'],['button','link','menuitem']],
 ['CG03','temporary-chat',['Temporary chat','Chat temporal'],['button','menuitem','switch']],
 ['CG03','stop',['Stop generating','Stop streaming','Detener generación','Detener respuesta'],['button']],
 ['CG04','composer',['Message ChatGPT','Ask anything','Pregunta lo que quieras','Mensaje para ChatGPT','Escribe un mensaje'],['textbox']],
 ['CG04','attach',['Attach files','Add photos and files','Add files and more','Adjuntar archivos','Añadir archivos y más','Añadir fotos y archivos'],['button','menuitem']],
 ['CG04','send',['Send','Send message','Enviar','Enviar mensaje'],['button']],
 ['CG05','copy',['Copy','Copy response','Copiar','Copiar respuesta'],['button','menuitem']],
 ['CG05','retry',['Retry','Regenerate','Regenerate response','Reintentar','Regenerar respuesta'],['button','menuitem']],
 ['CG05','download',['Download','Download file','Descargar','Descargar archivo'],['button','link','menuitem']],
 ['CG05','feedback',['Good response','Bad response','Buena respuesta','Mala respuesta'],['button']],
 ['CG06','model-picker',['Model','Choose model','Select model','Modelo','Elegir modelo','Seleccionar modelo'],['button','combobox','menuitem']],
 ['CG06','effort',['Thinking','Reasoning','Instant','High','Medium','Extended thinking','Pensamiento','Razonamiento','Instantáneo','Alto','Medio'],['button','option','menuitem','menuitemradio','radio','tab']],
 ['CG07','projects',['Projects','New project','Proyectos','Nuevo proyecto'],['button','link','menuitem','tab']],
 ['CG08','settings',['Settings','Ajustes','Configuración'],['button','link','menuitem','tab','dialog']],
 ['CG08','general',['General'],['button','tab','menuitem','link']],
 ['CG08','data-controls',['Data controls','Controles de datos'],['button','tab','menuitem','link']],
 ['CG08','security',['Security','Seguridad'],['button','tab','menuitem','link']],
 ['CG08','appearance',['Appearance','Apariencia','Theme','Tema'],['button','tab','menuitem','link','combobox']],
 ['CG08','language',['Language','Idioma'],['button','tab','menuitem','link','combobox']],
 ['CG09','personalization',['Personalization','Personalización','Customize ChatGPT','Personalizar ChatGPT'],['button','tab','menuitem','link']],
 ['CG09','memory',['Memory','Manage memories','Manage memory','Memoria','Gestionar memoria','Administrar recuerdos'],['button','tab','menuitem','link','switch']],
 ['CG10','apps',['Apps','Plugins','Connectors','Aplicaciones','Complementos','Conectores','Manage apps','Gestionar aplicaciones'],['button','tab','menuitem','link']],
 ['CG10','active-tools',['Active tools','Tools','Herramientas activas','Herramientas'],['button','tab','menuitem','link']],
 ['CG10','refresh-tools',['Refresh tools','Refresh metadata','Refresh tool catalog','Actualizar herramientas','Actualizar metadatos'],['button','menuitem']],
 ['CG10','vivim-plugin',['VIVIM ARBOR','VIVIM'],['button','link','menuitem','tab']],
 ['CG11','connect',['Connect','Reconnect','Connected apps','Conectar','Reconectar','Aplicaciones conectadas'],['button','menuitem','link']],
 ['CG11','developer-mode',['Developer mode','Modo desarrollador','Modo de desarrollador'],['button','switch','checkbox','tab']],
 ['CG11','permissions',['Permissions','Manage permissions','Permisos','Gestionar permisos'],['button','tab','link','menuitem']],
 ['CG12','work',['Work','Tasks','Scheduled tasks','Tareas','Tareas programadas','Schedules','Programaciones'],['button','link','tab','menuitem']],
 ['CG13','library',['Library','Files','Biblioteca','Archivos'],['button','link','tab','menuitem']],
 ['CG14','profile',['Profile','Account','Perfil','Cuenta'],['button','link','menuitem','tab']],
 ['CG14','auth',['Sign in','Log in','Log out','Sign out','Iniciar sesión','Cerrar sesión'],['button','link','menuitem']],
 ['CG14','subscription',['Subscription','Plan','Billing','Suscripción','Facturación'],['button','link','menuitem','tab']],
 ['CG15','notifications',['Notifications','Notificaciones'],['button','link','tab','menuitem']],
 ['CG15','retry-error',['Try again','Reload response','Volver a intentar','Recargar respuesta'],['button']],
 ['CG16','voice',['Voice','Voice mode','Start voice','Voz','Modo de voz','Iniciar voz'],['button','link','tab','menuitem']],
 ['CG16','image',['Create image','Generate image','Crear imagen','Generar imagen'],['button','menuitem']],
 ['CG17','share',['Share','Share chat','Compartir','Compartir chat'],['button','menuitem']],
 ['CG17','rename',['Rename','Rename chat','Cambiar nombre','Renombrar'],['button','menuitem']],
 ['CG17','archive',['Archive','Archive chat','Archivar','Archivar chat'],['button','menuitem']],
 ['CG17','delete',['Delete chat','Eliminar chat'],['button','menuitem']],
 ['CG18','keyboard',['Keyboard shortcuts','Atajos de teclado','Métodos abreviados de teclado'],['button','menuitem','link']],
 ['CG18','accessibility',['Accessibility','Accesibilidad'],['button','tab','menuitem','link']],
];
const index=new Map();
for(const [group,control,labels,allowed] of aliases)for(const label of labels){
 const key=normalize(label); const rows=index.get(key)??[];
 rows.push({group,control,roles:new Set(allowed)}); index.set(key,rows);
}
const toolPattern=/^vivim_[a-z0-9_]{1,96}$/;
function safeState(node){
 const state={};
 for(const p of Array.isArray(node?.properties)?node.properties:[]){
  const v=p?.value?.value;
  if(stateNames.has(p?.name)&&(typeof v==='boolean'||['true','false','mixed','menu','listbox','tree','grid','dialog'].includes(v)))state[p.name]=v;
 }
 return state;
}
export function projectChatGPTSurface(nodes){
 if(!Array.isArray(nodes))throw Object.assign(new Error('SURFACE_AX_INVALID'),{code:'SURFACE_AX_INVALID'});
 const groups=new Map(CHATGPT_SURFACE_GROUPS.map(g=>[g.id,{...g,candidates:[]}]));
 let scanned=0,unclassified=0,ambiguous=0,eligible=0,omitted=0;
 const tools=new Set(),rolesSeen={};
 for(const n of nodes){
  const role=n?.role?.value;
  if(n?.ignored!==false||!roles.has(role))continue;
  eligible++;rolesSeen[role]=(rolesSeen[role]??0)+1;
  if(scanned>=5000){omitted++;continue;} scanned++;
  const raw=typeof n.name?.value==='string'&&n.name.value.length<=160?n.name.value.trim():'';
  const state=safeState(n);
  const matches=(index.get(normalize(raw))??[]).filter(x=>x.roles.has(role));
  if(matches.length===1){
   const {group,control}=matches[0];groups.get(group).candidates.push({control,role,state,identity:'unverified-label-correspondence'});
  }else if(matches.length>1){ambiguous++;}
  else if(toolPattern.test(raw)&&['button','menuitem','link','option'].includes(role)){
   tools.add(raw);groups.get('CG10').candidates.push({control:'tool-id-label',role,state,identity:'unverified-label-correspondence'});
  }else{unclassified++;}
 }
 const summary=[...groups.values()].map(g=>({...g,observation:g.candidates.length?'candidate-controls-observed':'not-observed-in-this-view'}));
 return {schema:'vivim.chatgpt-surface/1',site:'chatgpt',scope:'current-accessibility-tree-only',complete:false,
  candidatesOnly:true,executionAuthorized:false,activationPermitted:false,sendPermission:false,
  groups:summary,toolIdCandidates:[...tools].sort(),coverage:{eligibleControls:eligible,scannedControls:scanned,omittedControls:omitted,unclassifiedControls:unclassified,ambiguousControls:ambiguous,roleCounts:rolesSeen,groupsWithCandidates:summary.filter(x=>x.candidates.length).length,totalGroups:summary.length},
  limitations:['Fixed labels are candidate correspondences, not verified locators or actions.','No account entitlement, hidden view, full history, tool availability or UI mutation is inferred.','Unknown labels, values and private text are omitted.']};
}
