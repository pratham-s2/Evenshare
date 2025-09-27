import { useEffect, useState } from 'react'


function TransactionUsers ({username, userAmounts, setUserAmounts, isPercentage, amount}){
    
    const colourMap = ["bg-blue-300", "bg-green-300", "bg-yellow-300", "bg-orange-300", "bg-pink-300"]

    const [mapIndex] = useState(Math.floor((Math.random()*colourMap.length)))
    
    const [usernameFirstLetter, setUsernameFirstLetter] = useState(username[0].toUpperCase())
    
    function handleAmountChange(curr_amount){
        setUserAmounts((prev)=>{
            curr_amount = curr_amount.toString()

              // Remove invalid characters except numbers and dot
              curr_amount = curr_amount.replace(/[^0-9.]/g, "");

              // Prevent multiple dots
              const parts = curr_amount.split(".");
              if (parts.length > 2) {
                curr_amount = parts[0] + "." + parts[1];
              }

              // Limit to 2 decimal places
              if (parts[1]) {
                parts[1] = parts[1].slice(0, 2);
                curr_amount = parts.join(".");
              }
  
            const newUserAmounts = {...prev}
            if (isPercentage){
                newUserAmounts[username][0] = curr_amount
                newUserAmounts[username][1] = Math.round((Number(curr_amount) / 100 * amount)*100)/100
            }
            else{
                newUserAmounts[username][1] = curr_amount
                if(amount==0){
                    newUserAmounts[username][0] = 0
                }
                else{
                    newUserAmounts[username][0] = Math.round((Number(curr_amount) / amount)*10000)/100
                }
            }
            console.log(newUserAmounts)
            return newUserAmounts
        })
    }

    return (
        <div className='flex flex-row items-center justify-between w-full my-1'>
            <div className='flex flex-row gap-2'>
                <p className={`px-2 rounded-full ${colourMap[mapIndex]}`}>{usernameFirstLetter}</p>
                <p>{username}</p>
            </div>
            
            <input type="text" placeholder="e.g 25" value={isPercentage ? (userAmounts[username]?.[0] ?? "") : (userAmounts[username]?.[1] ?? "")
  }
            className='w-1/3 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            onChange={(e)=>{handleAmountChange(e.target.value)}}/>
        </div>
    )
}


export default TransactionUsers