import { useRef, useState } from 'react'
import { useNavigate } from 'react-router';

function Login() {
    const userEmail = useRef("");
    const userPassword = useRef("");
    const userConfirmPassword = useRef("");
    const [auth, setAuth] = useState("");
    const [isSignUp, setIsSignUp] = useState(false); // Track mode
    const navigate = useNavigate();

    function validateEmail(email) {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    async function handleSubmit() {
        const email = userEmail.current;
        const password = userPassword.current;

        if (!validateEmail(email)) {
            setAuth("Please enter a valid email address");
            return;
        }

        if (isSignUp) {
            const confirmPassword = userConfirmPassword.current;
            if (password !== confirmPassword) {
                setAuth("Passwords do not match");
                return;
            }

            // Sign up request
            const response = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(errorData);
                setAuth(errorData.message || "Sign up failed");
            } else {
                setAuth("Sign up successful! You can now log in.");
                setIsSignUp(false); // Switch back to login
            }
        } else {
            // Login request
            const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password }),
                credentials: 'include'
            });

            const responseData = await response.json();

            if (responseData.status === "Success") {
                setTimeout(() => navigate("/dashboard"), 1000);
            } else {
                setAuth(responseData.status);
            }
        }
    }

    return (
        <div className="max-w-xl w-full mx-auto mt-20 p-8 bg-white border rounded-3xl shadow flex flex-col items-center gap-6">
            <h1 className="text-xl font-bold">{isSignUp ? "SIGN UP" : "LOG IN"}</h1>
            <div className="flex flex-col gap-4 w-full">
                <input
                    type="text"
                    placeholder="example@example.com"
                    className="px-4 py-2 rounded-2xl border w-full"
                    onChange={(e) => (userEmail.current = e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="px-4 py-2 rounded-2xl border w-full"
                    onChange={(e) => (userPassword.current = e.target.value)}
                />
                {isSignUp && (
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="px-4 py-2 rounded-2xl border w-full"
                        onChange={(e) => (userConfirmPassword.current = e.target.value)}
                    />
                )}
            </div>
            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg w-full"
                >
                    {isSignUp ? "Sign Up" : "Log In"}
                </button>
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="bg-white hover:underline text-black py-2 rounded-lg w-full"
                >
                    {isSignUp
                        ? "Already have an account? Log In."
                        : "Don't have an account? Sign Up."}
                </button>
            </div>
            {auth && <h1 className={auth=="Sign up successful! You can now log in." ? "text-green-500":"text-red-500"}>{auth}</h1>}
        </div>
    );
}

export default Login;
