import { useNavigate } from 'react-router';
import { useState} from 'react'
import { DollarSign, Users, Receipt, Calculator, CreditCard, History } from "lucide-react";

function Landing() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  async function handleDashboardNav (){
      const response = await fetch(`${import.meta.env.VITE_API_URL}/protected`,
        {credentials: "include"}
      )
      const responseData = await response.json()
      if (responseData.status=="success") {
        navigate('/dashboard')
      }
      else {
        navigate('/login')
      }
    }

  return (
    <div className='flex flex-col'>

      {/* Hero Section */}
      <div className='flex flex-grow flex-col justify-start items-center mt-32 px-4 text-center'>
        <p className='text-4xl sm:text-6xl font-bold mb-3 text-black'>Split TESTING CI/CD PIPELINE Easily with Friends</p>
        <p className='text-md sm:text-xl font-normal text-gray-800 mb-6'>
          Create groups, add friends, and split expenses fairly. No more awkward money conversations.
        </p>
        <div className='flex flex-row items-center justify-center gap-5'>
          <button
            className='bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg'
            onClick={handleDashboardNav}
          >
            Get Started
          </button>
          <button
            className='bg-white hover:bg-blue-100 rounded-lg px-5 py-2 text-blue-600 border'
            onClick={scrollToFeatures}
          >
            Learn More ↓
          </button>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="w-full py-20 bg-gray-100 mt-148">
        <div className="text-center mb-12 px-4">
          <h2 className="text-3xl sm:text-5xl font-bold text-black mb-2">Features that make bill splitting easy</h2>
          <p className="text-md sm:text-xl text-gray-600 max-w-xl mx-auto">
            Designed to make splitting expenses with friends, roommates, or travel companions simple and stress-free.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6 sm:px-20">
          {[
            { Icon: Users, title: "Create Groups", desc: "Easily create groups for roommates, trips, or events." },
            { Icon: Receipt, title: "Track Expenses", desc: "Log expenses as they happen and track who paid." },
            { Icon: Calculator, title: "Split Bills", desc: "Split evenly or with custom amounts." },
            { Icon: CreditCard, title: "Settle Up", desc: "See who owes whom and settle debts easily." },
            { Icon: History, title: "Transaction History", desc: "Full history of all group transactions." },
            { Icon: DollarSign, title: "Balance Tracking", desc: "Always know your balance in every group." },
          ].map(({ Icon, title, desc }, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 border border-gray-200 bg-white rounded-xl shadow hover:shadow-md hover:-translate-y-1 transition"
            >
              <div className="p-3 bg-blue-100 rounded-full mb-3">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{title}</h3>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
</section>

{/* CTA Section with gradient background */}
<section className="relative w-full py-12 md:py-24 overflow-hidden">
  {/* Background elements */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 z-0"></div>
  <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] opacity-10 z-0"></div>
  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0"></div>
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0"></div>

 <div className="relative px-4 md:px-6 z-10 flex justify-center">
  <div className="flex flex-col items-center space-y-4 text-center max-w-3xl">
    <div className="space-y-2">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">
        Ready to simplify your shared expenses?
      </h2>
      <p className="mx-auto max-w-[700px] md:text-xl text-white/80">
        Join thousands of users who have made splitting bills stress-free.
      </p>
    </div>
    <div className="space-x-4">
      <button
        onClick={handleDashboardNav}
        className="px-6 py-3 text-lg font-semibold bg-white text-blue-700 rounded-xl shadow hover:bg-gray-300 transition"
      >
        Sign Up Now
      </button>
    </div>
  </div>
</div>

</section>
    </div>
  );
}

export default Landing;
