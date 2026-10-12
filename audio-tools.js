'use strict';
window.JoonAudioTools = (() => {
 const formats={mp3:{ext:'mp3',mime:'audio/mpeg',codec:'libmp3lame'},m4a:{ext:'m4a',mime:'audio/mp4',codec:'aac'},wav:{ext:'wav',mime:'audio/wav',codec:'pcm_s16le'},flac:{ext:'flac',mime:'audio/flac',codec:'flac'},alac:{ext:'m4a',mime:'audio/mp4',codec:'alac'},copy:{ext:'m4a',mime:'audio/mp4',codec:'copy'}};
 async function coreAsset(url,type,signal){const cache=window.caches?await caches.open('joonmp3-converter-core-0.12.10'):null;let r=cache?await cache.match(url):null;if(!r){r=await fetch(url,{signal});if(!r.ok)throw Error('변환 엔진을 다운로드하지 못했어요.');if(cache)try{await cache.put(url,r.clone());}catch{}}return URL.createObjectURL(new Blob([await r.arrayBuffer()],{type}));}
 async function convert(blob,{format='m4a',bitrate=128,extension='m4a',start,end,onProgress=()=>{},signal}={}){
  if(!formats[format])throw Error('지원하지 않는 저장 형식이에요.');
  const worker=new Worker('./converter-worker.js'),urls=[];let rejectPending;
  const cancel=()=>{worker.terminate();rejectPending?.(new DOMException('취소됨','AbortError'));};signal?.addEventListener('abort',cancel);
  const request=(m,transfer=[])=>new Promise((resolve,reject)=>{rejectPending=reject;worker.onmessage=({data})=>{if(data.type==='progress')onProgress(data.progress);else if(data.type==='error')reject(Error(data.message));else resolve(data);};worker.onerror=()=>reject(Error('음성 변환을 실행하지 못했어요.'));worker.postMessage(m,transfer);});
  try{if(signal?.aborted)throw new DOMException('취소됨','AbortError');onProgress(0);const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/';urls.push(await coreAsset(base+'ffmpeg-core.js','text/javascript',signal));urls.push(await coreAsset(base+'ffmpeg-core.wasm','application/wasm',signal));if(signal?.aborted)throw new DOMException('취소됨','AbortError');await request({type:'load',coreURL:urls[0],wasmURL:urls[1]});const input=await blob.arrayBuffer();if(signal?.aborted)throw new DOMException('취소됨','AbortError');const result=await request({type:'convert',input,extension:extension.replace(/[^a-z0-9]/gi,'').slice(0,10)||'audio',format,bitrate,start,end},[input]);onProgress(1);return new Blob([result.output],{type:formats[format].mime});}
  finally{signal?.removeEventListener('abort',cancel);worker.terminate();for(const u of urls)URL.revokeObjectURL(u);}
 }
 return {formats,convert};
})();
