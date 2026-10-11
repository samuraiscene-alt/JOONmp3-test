'use strict';
let core;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      importScripts(data.coreURL);
      core = await self.createFFmpegCore({ mainScriptUrlOrBlob: data.coreURL + '#' + btoa(JSON.stringify({ wasmURL: data.wasmURL })) });
      core.setProgress(({ progress }) => self.postMessage({ type: 'progress', progress }));
      self.postMessage({ type: 'loaded' });
    } else if (data.type === 'convert') {
      if (!core) throw new Error('변환 엔진이 준비되지 않았어요.');
      const name = 'input.' + data.extension;
      core.FS.writeFile(name, new Uint8Array(data.input));
      core.setTimeout(-1);
      core.exec('-i', name, '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', data.bitrate + 'k', '-y', 'output.mp3');
      const code = core.ret; core.reset();
      if (code !== 0) throw new Error('음성이 없거나 지원하지 않는 음성 형식이에요. 다른 영상으로 시도해 주세요.');
      const output = core.FS.readFile('output.mp3');
      core.FS.unlink(name); core.FS.unlink('output.mp3');
      self.postMessage({ type: 'done', output: output.buffer }, [output.buffer]);
    }
  } catch (error) { self.postMessage({ type: 'error', message: error.message || String(error) }); }
};
