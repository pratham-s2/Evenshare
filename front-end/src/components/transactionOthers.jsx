import { useState } from "react";

function TransactionOthers({ 
  name, 
  balance_amount, 
  description, 
  date, 
  creator_id, 
  total_amount, 
  current_user_id,
  onPay,
  transaction_id // callback for confirming payment
}) {
  const [showModal, setShowModal] = useState(false);
  const [payAmount, setPayAmount] = useState(balance_amount);
  const [success, setSuccess] = useState(true)


  const amountStyle = balance_amount > 0 ? "text-red-500" : "text-green-500";
  const formattedAmount = Math.abs(balance_amount).toFixed(2) 
  const displayAmount =
    balance_amount > 0
      ? `-$${formattedAmount}` 
      : `+$${formattedAmount}`;

  const handleConfirmPay = () => {
    let result = onPay({payAmount, transaction_id}); // pass amount back to parent
    setSuccess(result)
    setTimeout(()=>{setSuccess(true)}, 500)
    if (result){
      setShowModal(false);
    }
  };

  return (
    <div className="w-full border mx-auto border-gray-300 text-black rounded-xl p-4 mb-4 flex flex-col hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-lg font-semibold">{name}</h1>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Last edited: {new Date(date).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">Created By: {creator_id}</p>
        </div>
        <div className="text-right">
          <h1 className={`text-xl font-bold ${amountStyle}`}>{displayAmount}</h1>
          <p className="text-sm text-gray-700">
            Total amount: ${total_amount.toFixed(2)}
          </p>
        </div>
      </div>
      <hr className="border-t-1 border-gray-200 mb-2" />
      <button
        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg mx-14 text-white font-bold"
        onClick={() => {
          setPayAmount(balance_amount);
          setShowModal(true);
        }}
      >
        PAY
      </button>

      {/* Pay Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-[#00000099] bg-opacity-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-80 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Confirm Payment</h2>
            <p className="text-sm text-gray-600 mb-2">
              Enter the amount you have paid back ($):
            </p>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              value={payAmount}
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

              setPayAmount(value);
            }}
            />

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPay}
                className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
              >
                Pay
              </button>
            </div>
          {!success && <p className="text-red-400 text-xs flex flex-row justify-center mt-2">Something went wrong</p>}
            
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionOthers;
