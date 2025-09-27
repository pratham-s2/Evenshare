import './App.css'
import Landing from './pages/landing'
import Navbar from './components/navbar'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import GroupDetails from './components/groupDetails'
import { BrowserRouter, Route, Routes } from 'react-router';

function App() {
  
  return (
    <div className='relative'>
      <BrowserRouter>
        <Navbar/>
        <Routes>
          <Route exact path="/" element={<Landing/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path ="/dashboard" element={<Dashboard/>}/>
          <Route path = "/dashboard/:group_id" element={<GroupDetails/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
