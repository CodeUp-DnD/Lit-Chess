function vertexShader() {  // and GLSL can be minimized
    return `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix *
                  modelViewMatrix *
                  vec4(position,1.0);
  }`;}

function fragmentShader() {
    return `#ifdef GL_ES
precision mediump float;
#endif

#define SEED 1.123456789
#define HASHM mat4(40.15384,31.973157,31.179219,10.72341,13.123009,41.441023,-311.61923,10.41234,178.127121,16.34673,12.94702,36.97206,90.58375,76.92655,13.39964,17.63895)

uniform vec2 u_resolution;
uniform float u_time;

float hash(vec3 p){
  // from https://www.shadertoy.com/view/MtlczH
  // @aft
  // Licensed under MIT.
  
  // An attempt to create a seeded hash
  // without sine with less artifacts.
  
  // Based on David Hoskins' idea.
  // https://www.shadertoy.com/view/4djSRW
  vec4 p4=fract(vec4(p.x,p.y,p.z,(p.x+p.y+p.z+SEED*1e-7))*HASHM);
  p4+=dot(p4,p4.yzxw+41.19);
  return fract((p4.x+p4.y+p4.z)*p4.w);
}

float smoothNoise(vec3 uv){
  // based on https://www.youtube.com/watch?v=zXsWftRdsvU
  vec3 lv=fract(uv);
  lv=lv*lv*(3.-2.*lv);
  vec3 id=floor(uv);
  
  float bl=hash(id+vec3(0.,0.,0.));
  float br=hash(id+vec3(1.,0.,0.));
  float b=mix(bl,br,lv.x);
  
  float tl=hash(id+vec3(0.,1.,0.));
  float tr=hash(id+vec3(1.,1.,0.));
  float t=mix(tl,tr,lv.x);
  
  float twoD=mix(b,t,lv.y);
  
  float bl2=hash(id+vec3(0.,0.,1.));
  float br2=hash(id+vec3(1.,0.,1.));
  float b2=mix(bl2,br2,lv.x);
  
  float tl2=hash(id+vec3(0.,1.,1.));
  float tr2=hash(id+vec3(1.,1.,1.));
  float t2=mix(tl2,tr2,lv.x);
  
  float twoD2=mix(b2,t2,lv.y);
  
  return mix(twoD,twoD2,lv.z);
}

float noiseAndFBM(vec3 uv){// add 4 octaves
  // based on https://www.youtube.com/watch?v=zXsWftRdsvU
  float c=smoothNoise(uv*4.);
  c+=smoothNoise(uv*8.)*.5;
  c+=smoothNoise(uv*16.)*.25;
  c+=smoothNoise(uv*32.)*.125;
  c+=smoothNoise(uv*64.)*.0625;
  c/=2.;// divide to keep within 1;
  return c;
}

void main(void){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  //  uv += u_time * 0.1;
  float c=noiseAndFBM(vec3(uv,u_time*.03));
  //  vec3 col = vec3(c);
  vec3 col=vec3(c,.36*c,.07*c);
  
  //  col.rg = id * 0.1;//lv;
  gl_FragColor=vec4(col,1.);
}`;
}
