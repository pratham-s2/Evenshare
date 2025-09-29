import { X } from "lucide-react"
import { useState, useEffect } from "react"
import TransactionUsers from "./transactionUsers"
import ToggleSwitch from "./toggleSwitch"

function AddTransactionModal({ onClose, group_id, groupMembers, initialValues, isEdit=false, transaction_id="", initializeGroupDetails }) {
    const [amount, setTransactionAmount] = useState(0.00)
    const [name, setTransactionName] = useState("")
    const [description, setTransactionDescription] = useState("")
    const [date, setTransactionDate] = useState("")
    const [validFields, setValidFields] = useState({success: true, message: "neutral"})
    const [userAmounts, setUserAmounts] = useState({})
    const [isPercentage, setIsPercentage] = useState(true);
    const [success, setSuccess] = useState("neutral")

    useEffect(() => {
    if (isEdit && initialValues) {
      setTransactionName(initialValues.name || "")
      setTransactionAmount(initialValues.amount || 0)
      setTransactionDescription(initialValues.description || "")
      setTransactionDate(initialValues.date.slice(0,10) || "")
      
      // Initialize userAmounts based on initialValues.balances
     if (initialValues.balances && initialValues.balances.length > 0) {
      let tempUserAmounts = {}
      const totalAmount = initialValues.amount || 0

      let usedAmount = 0
      let usedPercentage = 0

      initialValues.balances.forEach(balance => {
        const percentage = totalAmount > 0 
          ? Math.round((balance.balance_amount / totalAmount) * 10000) / 100 
          : 0

        tempUserAmounts[balance.assignee_id] = [percentage, balance.balance_amount]

        usedAmount += balance.balance_amount
        usedPercentage += percentage
      })

      // Handle missing members (like the creator)
      groupMembers.forEach(member => {
        if (!(member in tempUserAmounts)) {
          const remainingAmount = Math.round((totalAmount - usedAmount) * 100) / 100
          const remainingPercentage = Math.round((100 - usedPercentage) * 100) / 100

          tempUserAmounts[member] = [remainingPercentage, remainingAmount]
        }
      })

      setUserAmounts(tempUserAmounts)
      console.log("userAmounts:", tempUserAmounts)
    }
    } else {
      // If not editing, initialize userAmounts evenly across groupMembers
      let tempUserAmounts = {}
      for (let username of groupMembers) {
        let percentage = Math.round((100 / groupMembers.length) * 100) / 100
        tempUserAmounts[username] = [percentage, Math.round((percentage / 100) * amount * 100) / 100]
      }
      setUserAmounts(tempUserAmounts)
    }
  }, [isEdit, initialValues, groupMembers, amount])

    const fields = {
      amount: Number(amount),
      date,
      description,
      name,
      group_id
    }

    function validateFields(fields){
      for (const [key, value] of Object.entries(fields)){
        if (String(value).trim()==""){
          return {success: false, message: "bad fields"}}
        }
      
      let percent_sum = 0, amount_sum = 0
      
      for (let username in userAmounts){
        percent_sum += Number(userAmounts[username]?.[0])
        amount_sum += Number(userAmounts[username]?.[1])
      }

      if (fields.amount==0){
        return {success: false, message: "bad amount"}
      }

      if (Math.round(percent_sum)!=100){
        return {success: false, message: "bad percentage sum"}
      }
      else if ((amount_sum-amount)>0.10){
        return {success: false, message: "bad amount sum"}
      }

      return {success: true, message: "success"}
    }

    async function handleAddTransaction(){
      const validateFieldsResults = validateFields(fields)
      setValidFields(validateFieldsResults)
      
      setTimeout(()=>{
        setValidFields((prev)=>{
          let temp = {...prev}
          temp.status = false
          temp.message="neutral"
          return temp
        })
      }, 2000)

      if (validateFieldsResults.success){
         const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/groups/details/transactions/edit`
        : `${import.meta.env.VITE_API_URL}/groups/details/transactions`

        const method = isEdit ? "PATCH" : "POST"

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({fields, userAmounts, ...(transaction_id &&  {transaction_id}) })
        }) //next steps: add transactions: verify transaction details, add to db, redo math on transaction totals. display the transactions from the db) and calculate on useeffect and change of transaction
          //pass in group_id and relevant group info to the modal from the add transaction button
        
          const responseData = await response.json()
          if (responseData.success){
            setSuccess("success")
            setTimeout(()=>{setSuccess("neutral")
              onClose()}, 1000)
            initializeGroupDetails()

          }
          else{
            setSuccess("error")
            setTimeout(()=>{setSuccess("neutral")
              }, 1000)
          }
          
    }}

  return (
     <div className="fixed inset-0 bg-[#00000099] bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-2xl w-full max-w-[90vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="space-y-3 sm:space-y-4 lg:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Name</label>
            <input
            value={name}
              className={`w-full border border-gray-300 rounded-lg p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="e.g. Restaurant dinner" onChange={(e)=>setTransactionName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
           
          <input
            type="text"
            value={amount}
            className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. 45.50"
            onChange={(e) => {
              let value = e.target.value;

              // Remove invalid characters except numbers and dot
              value = value.replace(/[^0-9.]/g, "");

              // Prevent multiple dots
              const parts = value.split(".");
              if (parts.length > 2) {
                value = parts[0] + "." + parts[1];
              }

              // Limit to 2 decimal places
              if (parts[1]) {
                parts[1] = parts[1].slice(0, 2);
                value = parts.join(".");
              }

              setTransactionAmount(value);
            }}
          />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              value={description}
              className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Dinner with friends at Italian restaurant" onChange={(e)=>setTransactionDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              value={date}
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e)=>setTransactionDate(e.target.value)}
            />
          </div>
          {validFields.message=="bad fields" && <p className="text-red-400 text-center">Ensure all fields are filled out</p>}
        </div>
        <div>
          <div className="flex flex-row justify-between items-end mr-3 mt-4 sm:mt-6 lg:mt-7 mb-3 sm:mb-4">
            <p className="text-base sm:text-lg font-semibold">Assign Costs:</p>
            <div className="mr-1">
              <ToggleSwitch isPercentage={isPercentage} setIsPercentage={setIsPercentage}/>
            </div>
          </div>
          {groupMembers.map((element)=><TransactionUsers username={element} userAmounts={userAmounts} amount={amount} 
          setUserAmounts={setUserAmounts} isPercentage={isPercentage} key={element}/>)}
          
          {validFields.message=="bad percentage sum" && <p className="text-red-400 text-center">Ensure percentages add up to 100%</p>}
          {validFields.message=="bad amount sum" && <p className="text-red-400 text-center">Ensure dollar amounts add up to <span className="font-bold">${amount}</span></p>}
          {validFields.message=="bad amount" && <p className="text-red-400 text-center">Ensure total amount is greater than zero</p>}
          
        </div>
        <div className="flex justify-center gap-3 mt-6 sm:mt-8">
          <button className="px-8 sm:px-12 lg:px-14 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base" onClick={handleAddTransaction}>
             {isEdit ? "Save Changes" : "Add Transaction"}
          </button>
        </div>
        {success=="success" && <p className="text-green-400">Successfully added transaction</p>}
        {success=="error" && <p className="text-red-400">Something went wrong</p>}
      </div>
    </div>
  );
}

export default AddTransactionModal;
