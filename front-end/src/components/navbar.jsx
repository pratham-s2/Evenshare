import { DollarSign } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useState, useEffect } from 'react'

function Navbar(){
    const navigate = useNavigate();
    const location = useLocation();
    const [signedIn, setSignedIn] = useState(false)
    
    async function checkSignedIn (){
      const response = await fetch(`${import.meta.env.VITE_API_URL}/protected`,
        {credentials: "include",
          headers:{
            "Content-Type": "application/json"
          }
        }
      )
      const responseData = await response.json()

      setSignedIn(responseData.status=="success")
    }

    useEffect (()=>{checkSignedIn()}, [location.pathname])


    async function handleDashboardNav (){
      if (signedIn) {
        navigate('/dashboard')
      }
      else {
        navigate('/login')
      }
    }

    async function handleLogin (){
      if (signedIn && location.pathname!="/login") {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/logout`, 
        {method: "POST", credentials: "include"})
        const responseData = await response.json()
        console.log(responseData.status)
        setSignedIn(false)
        setTimeout(()=>navigate('/'), 500)
      }
      else{
        navigate("/login")
      }
    }

    return(
      <div>
        <div className='flex flex-row items-center justify-between mt-2 mx-20'>
          <div className='flex flex-row items-center justify-start gap-10'>
            <div className='flex flex-row items-center justify-center gap-2 mr-6'>
              <DollarSign className='w-8 h-8 text-blue-600'/>
              <button className='text-xl font-bold text-black opacity-75 hover:opacity-100' onClick={()=> {if(location.pathname!='/'){navigate('/')}}} >
                EvenShare
              </button>
            </div>
            <button className='ml-6 text-md hover:underline' onClick={handleDashboardNav}>Dashboard</button>
            <button className='text-md hover:underline'>Account</button>
          </div>
          <div>
            <button className='bg-blue-600 hover:bg-blue-500 text-white px-4 py-[8px] rounded-lg' 
              onClick={handleLogin}>
              {(signedIn) ? "Log Out" : "Log In"}
            </button>
          </div>
        </div>
        <hr className='border-t border-gray-300 mt-2'></hr>
      </div>
        

    )
}

export default Navbar;