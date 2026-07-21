import { useState } from 'react'

import './App.css'
import axios from 'axios';


async function increment(){
    const response = await axios.post("http://localhost:3000/increment");
    console.log(response.data.count)
}



function App() {
  const [count, setCount] = useState(0);

  return (
    <>
    <h1>Welcome</h1>
    <button onClick={() => setCount(increment())}>Click me</button>
    {console.log(count)}
    </>
  )
}

export default App
