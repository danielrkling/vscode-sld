sld`
  <button class="btn" disabled sld>Button</button>
  <div class="btn" disabled>
    <Counter>
    Hello 
    asd World
    </Counter>
  </div>
`


function App() {
  return sld`
    <div>
      <Counter>${"Hello"}</Counter>
    </div>
  `;
}