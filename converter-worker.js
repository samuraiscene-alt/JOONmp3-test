'use strict';
let core;
self.onmessage=async({data})=>{
 try{
  if(data.type==='load'){
   importScripts(data.coreURL);core=await self.createFFmpegCore({mainScriptUrlOrBlob:data.coreURL+'#'+btoa(JSON.stringify({wasmURL:data.wasmURL}))});
   core.setProgress(({progress})=>self.postMessage({type:'progress',progress}));self.postMessage({type:'loaded'});
  }else if(data.type==='convert'){
   if(!core)throw Error('변환 엔진이 준비되지 않았어요.');
   const formats={mp3:['libmp3lame','mp3'],m4a:['aac','m4a'],wav:['pcm_s16le','wav'],flac:['flac','flac'],alac:['alac','m4a'],copy:['copy','m4a']};const spec=formats[data.format||'mp3'];if(!spec)throw Error('지원하지 않는 저장 형식이에요.');
   const input='input.'+data.extension,output='output.'+spec[1];core.FS.writeFile(input,new Uint8Array(data.input));
   const args=['-i',input,'-map','0:a:0','-vn'];
   if(Number.isFinite(data.start)&&Number.isFinite(data.end)){if(data.start<0||data.end<=data.start)throw Error('자르기 구간을 확인해 주세요.');args.push('-ss',String(data.start),'-t',String(data.end-data.start));}
   args.push('-c:a',spec[0]);if(['mp3','m4a'].includes(data.format||'mp3'))args.push('-b:a',String(data.bitrate||192)+'k');if(spec[1]==='m4a')args.push('-movflags','+faststart');
   try{core.setTimeout(-1);core.exec(...args,'-y',output);const code=core.ret;core.reset();if(code!==0)throw Error(data.format==='copy'?'이 원본 음성은 M4A에 그대로 담을 수 없어요. 다른 저장 형식을 선택해 주세요.':'이 형식으로 음성을 변환하지 못했어요.');const bytes=core.FS.readFile(output);self.postMessage({type:'done',output:bytes.buffer},[bytes.buffer]);}
   finally{for(const name of [input,output])try{core.FS.unlink(name);}catch{}}
  }
 }catch(error){self.postMessage({type:'error',message:error.message||String(error)});}
};
