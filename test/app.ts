import { render, spread } from "solid-js/web";
import { createSignal, createContext, useContext } from "solid-js";
import { SLD, sld } from "./sld.ts";

const ctx = createContext("Wrong Context");

const mySLD = SLD({ Counter, ShowChildren, ReadContext, Provider: ctx.Provider });

function ReadContext() {
  const context = useContext(ctx);

  return sld`<div>${context}</div>`;
}

function ShowChildren(props) {
  return props.children;
}

function Counter(props) {
  const [count, setCount] = createSignal(1);
  const increment = () => setCount((count) => count + 1);

  return sld`<button ...${props}  type="button" onClick=${increment}>
      ${() => count()} - ${() => props.message}
    </button>`;
}

function CounterList() {
  const [demo, setDemo] = createSignal(1);
  const [list, setList] = createSignal([0, 1, 2]);

  return sld`<div>
    <For each=${list}>${(v) => sld`<div>${v}-${demo}</div>`}</For>
    <button on:click=${() => setList([...list(), Math.random()])}>new button</button>
    <button on:click=${() => setDemo(demo() + 1)}>add</button>
    </div>
    `;
}


render(
  sld`    <Provider value=${"Correct Context"}><ReadContext /></Provider>
    <Show when=${false} >${"B"}</Show>
    <ShowChildren>This Should be A: ${"A"}</ShowChildren>
    <div><Counter message="Hello" ...${{ style: "color:red" }} /></div>
    <CounterList />
    <MathMl />
    <SVG />
    <input >
    `,
  document.getElementById("app")!,
);



function MathMl() {
  return sld`<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mi>x</mi>
  <mo>=</mo>
  <mfrac>
    <mrow>
      <mo>-</mo>
      <mi>b</mi>
      <mo>&#xB1;</mo>
      <msqrt>
        <msup>
          <mi>b</mi>
          <mn>2</mn>
        </msup>
        <mo>-</mo>
        <mn>4</mn>
        <mo>&#x2062;</mo>
        <mi>a</mi>
        <mi>c</mi>
      </msqrt>
    </mrow>
    <mrow>
      <mn>2</mn>
      <mi>a</mi>
    </mrow>
  </mfrac>
</math>
`;
}

//svg made by chat GPT
function SVG(){
    return sld`
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Definitions for gradients and filters -->
  <defs>
    <!-- Radial Gradient -->
    <radialGradient id="radialGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFCC00" />
      <stop offset="100%" stop-color="#FF6600" />
    </radialGradient>

    <!-- Linear Gradient -->
    <linearGradient id="linearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00CCFF" />
      <stop offset="100%" stop-color="#0066FF" />
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="3" stdDeviation="4" flood-color="#333" flood-opacity="0.6"/>
    </filter>

    <!-- Clip Path -->
    <clipPath id="clipCircle">
      <circle cx="200" cy="200" r="120" />
    </clipPath>
  </defs>

  <!-- Background Circle with radial gradient and drop shadow -->
  <circle cx="200" cy="200" r="120" fill="url(#radialGradient)" filter="url(#dropShadow)" />

  <!-- Decorative star path using Bézier curves -->
  <path
    d="M200,80 
       C210,120 240,120 250,80 
       C260,120 290,120 300,80 
       C310,140 260,160 250,200 
       C260,240 310,260 300,320 
       C290,280 260,280 250,320 
       C240,280 210,280 200,320 
       C190,280 160,280 150,320 
       C140,260 190,240 200,200 
       C190,160 140,140 150,80 
       C160,120 190,120 200,80 Z"
    fill="url(#linearGradient)"
    stroke="#003366"
    stroke-width="2"
    transform="rotate(5 200 200)"
    opacity="0.9"
    clip-path="url(#clipCircle)"
  />

  <!-- Group with transformed elements -->
  <g transform="translate(200, 200) scale(1.2)">
    <!-- Inner circle -->
    <circle r="40" fill="white" stroke="#666" stroke-width="2" />
    <!-- Text label -->
    <text x="0" y="6" text-anchor="middle" font-family="Arial" font-size="18" fill="#333">
      Badge
    </text>
  </g>
</svg>

`
}
