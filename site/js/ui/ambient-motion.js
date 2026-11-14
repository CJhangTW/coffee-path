/** A bounded, slow oscillation which runs only while the scene is visible. */
export function createAmbientMotion({render,requestFrame,cancelFrame}) {
  let visible=false,pageVisible=true,reduced=false,disposed=false,frame=0,lastTime=null,elapsed=0;
  function tick(time) {
    frame=0;if(disposed||!visible||!pageVisible||reduced)return;
    if(lastTime!==null)elapsed+=Math.min(Math.max(time-lastTime,0),100);
    lastTime=time;
    render(Math.sin(elapsed*2*Math.PI/16000)*0.055);
    if(!disposed&&visible&&pageVisible&&!reduced)frame=requestFrame(tick);
  }
  function refresh() {
    if(disposed)return;
    if(visible&&pageVisible&&!reduced){if(!frame){lastTime=null;frame=requestFrame(tick);}}
    else {if(frame)cancelFrame(frame);frame=0;lastTime=null;if(reduced)render(0);}
  }
  return {
    setVisible(value){visible=value;refresh();},
    setPageVisible(value){pageVisible=value;refresh();},
    setReduced(value){reduced=value;refresh();},
    dispose(){if(disposed)return;disposed=true;if(frame)cancelFrame(frame);frame=0;}
  };
}
