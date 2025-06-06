// // 'use client';

// // import Link from 'next/link';
// // import { useEffect, useState } from 'react';
// // import { Menu, X, ChevronDown } from 'lucide-react';
// // import { Subset } from '../../generated/prisma/index';

// // export default function Navbar() {
// //   const [isOpen, setIsOpen] = useState(false);
// //   const [userEmail, setUserEmail] = useState<string | null>(null);
// //   const [showLoginDropdown, setShowLoginDropdown] = useState(false);
// //   const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);

// //   useEffect(() => {
// //     const user = JSON.parse(localStorage.getItem('flipr_user') || 'null');
// //     if (user?.email) {
// //       setUserEmail(user.email);
// //     }
// //   }, []);

// //   const handleLogout = () => {
// //     localStorage.removeItem('flipr_user');
// //     setUserEmail(null);
// //     window.location.href = '/';
// //   };

// //   const renderAuthOptions = () => {
// //     if (userEmail) {
// //       return (
// //         <>
// //           <span className="text-gray-700">Hi, {userEmail}</span>
// //           <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
// //         </>
// //       );
// //     }

// //     return (
// //       <>
// //         {/* Register Dropdown */}
// //         <div className="relative">
// //           <button
// //             className="flex items-center text-gray-700 hover:text-blue-600"
// //             onClick={() => {
// //               setShowRegisterDropdown(!showRegisterDropdown);
// //               setShowLoginDropdown(false);
// //             }}
// //           >
// //             Register <ChevronDown className="ml-1 w-4 h-4" />
// //           </button>
// //           {showRegisterDropdown && (
// //             <div className="absolute bg-white border rounded shadow mt-2 w-48 z-10">
// //               <Link href="/company/register" className="block px-4 py-2 hover:bg-gray-100">Register a Company</Link>
// //               <Link href="/user/register" className="block px-4 py-2 hover:bg-gray-100">Register as a User</Link>
// //             </div>
// //           )}
// //         </div>

// //         {/* Login Dropdown */}
// //         <div className="relative">
// //           <button
// //             className="flex items-center text-gray-700 hover:text-blue-600"
// //             onClick={() => {
// //               setShowLoginDropdown(!showLoginDropdown);
// //               setShowRegisterDropdown(false);
// //             }}
// //           >
// //             Login <ChevronDown className="ml-1 w-4 h-4" />
// //           </button>
// //           {showLoginDropdown && (
// //             <div className="absolute bg-white border rounded shadow mt-2 w-48 z-10">
// //               <Link href="/company/login" className="block px-4 py-2 hover:bg-gray-100">Login as Admin</Link>
// //               <Link href="/user/login" className="block px-4 py-2 hover:bg-gray-100">Login as User</Link>
// //             </div>
// //           )}
// //         </div>
// //       </>
// //     );
// //   };

// //   return (
// //     <nav className="bg-white border-b border-gray-200 shadow-sm relative z-50">
// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <div className="flex justify-between h-16 items-center">
// //           {/* Logo */}
// //           <div className="flex-shrink-0">
// //             <Link href="/" className="text-xl font-bold text-blue-600">FliprBot</Link>
// //           </div>

// //           {/* Desktop Menu */}
// //           <div className="hidden md:flex space-x-6 items-center">
// //             <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
// //             <Link href="/customer/chat" className="text-gray-700 hover:text-blue-600">Chatbot</Link>
// //             {renderAuthOptions()}
// //           </div>

// //           {/* Mobile Menu Button */}
// //           <div className="md:hidden">
// //             <button
// //               onClick={() => setIsOpen(!isOpen)}
// //               className="text-gray-700 hover:text-blue-600 focus:outline-none"
// //             >
// //               {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Mobile Menu */}
// //       {isOpen && (
// //         <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
// //           <Link href="/" className="block py-2 text-gray-700 hover:text-blue-600">Home</Link>
// //           <Link href="/customer/chat" className="block py-2 text-gray-700 hover:text-blue-600">Chatbot</Link>
// //           {userEmail ? (
// //             <>
// //               <span className="block py-2 text-gray-700">Hi, {userEmail}</span>
// //               <button onClick={handleLogout} className="block py-2 text-red-600 hover:underline">Logout</button>
// //             </>
// //           ) : (
// //             <>
// //               <div className="py-2">
// //                 <span className="text-sm font-medium text-gray-500">Register</span>
// //                 <Link href="/company/register" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Register a Company</Link>
// //                 <Link href="/user/register" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Register as a User</Link>
// //               </div>
// //               <div className="py-2">
// //                 <span className="text-sm font-medium text-gray-500">Login</span>
// //                 <Link href="/company/login" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Login as Admin</Link>
// //                 <Link href="/user/login" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Login as User</Link>
// //               </div>
// //             </>
// //           )}
// //         </div>
// //       )}
// //     </nav>
// //   );
// // }

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

type RegularUser = {
  email: string;
  role: 'USER';
};
type AgentUser = {
  email: string;
  role: 'AGENT';
  subdomain: string;
};
type CurrentUser = RegularUser | AgentUser | null;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [user, setUser] = useState<CurrentUser>(null);
  const router = useRouter();

  useEffect(() => {
    // 1) USER via localStorage
    const stored = localStorage.getItem('flipr_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser({ email: u.email, role: 'USER' });
        return;
      } catch {
        localStorage.removeItem('flipr_user');
      }
    }

    // 2) AGENT via auth_token cookie
    const tokenMatch = document.cookie.match(/auth_token=([^;]+)/);
    if (!tokenMatch) {
      setUser(null);
      return;
    }
    try {
      const decoded = JSON.parse(atob(tokenMatch[1].split('.')[1]));
      if (decoded.role === 'AGENT' && decoded.subdomain) {
        setUser({
          email: decoded.email,
          role: 'AGENT',
          subdomain: decoded.subdomain,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    fetch('/api/agent/logout', { method: 'GET', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        localStorage.removeItem('flipr_user');
        setUser(null);
        router.push('/');
      });
  };

  // --- USER view ---
  if (user?.role === 'USER') {
    return (
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            FliprBot
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/customer/chat"
              className="text-gray-700 hover:text-blue-600"
            >
              Chatbot
            </Link>
            <span className="text-gray-700">Hi, {user.email}</span>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // --- AGENT & ANONYMOUS share this layout ---
  const renderAuthArea = () => {
    if (user?.role === 'AGENT') {
      return (
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Hi, {user.email}</span>
          <Link
            href={`/${user.subdomain}/agent/dashboard`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      );
    }

    // anonymous
    return (
      <div className="flex items-center space-x-6">
        {/* Register dropdown */}
        <div className="relative">
          <button
            className="flex items-center text-gray-700 hover:text-blue-600"
            onClick={() => {
              setShowRegisterDropdown(!showRegisterDropdown);
              setShowLoginDropdown(false);
            }}
          >
            Register <ChevronDown className="ml-1 w-4 h-4" />
          </button>
          {showRegisterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-20">
              <Link
                href="/company/register"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Register Company
              </Link>
              <Link
                href="/user/register"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Register User
              </Link>
            </div>
          )}
        </div>

        {/* Login dropdown */}
        <div className="relative">
          <button
            className="flex items-center text-gray-700 hover:text-blue-600"
            onClick={() => {
              setShowLoginDropdown(!showLoginDropdown);
              setShowRegisterDropdown(false);
            }}
          >
            Login <ChevronDown className="ml-1 w-4 h-4" />
          </button>
          {showLoginDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-20">
              <Link
                href="/company/login"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Login as Admin
              </Link>
              <Link
                href="/user/login"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Login as User
              </Link>
              <Link
                href="/agent/login"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Login as Agent
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            FliprBot
          </Link>

          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link
              href="/customer/chat"
              className="text-gray-700 hover:text-blue-600"
            >
              Chatbot
            </Link>
            {renderAuthArea()}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-2">
          <Link href="/" className="block py-2 text-gray-700 hover:text-blue-600">
            Home
          </Link>
          <Link
            href="/customer/chat"
            className="block py-2 text-gray-700 hover:text-blue-600"
          >
            Chatbot
          </Link>
          {user?.role === 'AGENT' && (
            <>
              <Link
                href={`/${user.subdomain}/agent/dashboard`}
                className="block bg-blue-600 text-white px-4 py-2 rounded text-center"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          )}
          {user === null && (
            <>
              <div>
                <span className="text-sm font-medium text-gray-500">Register</span>
                <Link
                  href="/company/register"
                  className="block px-2 py-1 text-gray-700 hover:text-blue-600"
                >
                  Company
                </Link>
                <Link
                  href="/user/register"
                  className="block px-2 py-1 text-gray-700 hover:text-blue-600"
                >
                  User
                </Link>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Login</span>
                <Link
                  href="/company/login"
                  className="block px-2 py-1 text-gray-700 hover:text-blue-600"
                >
                  Admin
                </Link>
                <Link
                  href="/user/login"
                  className="block px-2 py-1 text-gray-700 hover:text-blue-600"
                >
                  User
                </Link>
                <Link
                  href="/agent/login"
                  className="block px-2 py-1 text-gray-700 hover:text-blue-600"
                >
                  Agent
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}



// app/components/Navbar.tsx
// 'use client';
// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// export default function Navbar() {
//   const [isOpen, setIsOpen] = useState(false);
//   // const [userEmail, setUserEmail] = useState<string | null>(null);
//   const [showLoginDropdown, setShowLoginDropdown] = useState(false);
//   const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
//   const [user, setUser] = useState<{
//     email: string;
//     role: string;
//     subdomain: string;
//   } | null>(null);

//   useEffect(() => {
//     const cookie = document.cookie;
//     const tokenMatch = cookie.match(/auth_token=([^;]+)/);
//     if (!tokenMatch) return;

//     try {
//       const token = tokenMatch[1];
//       const decoded = JSON.parse(atob(token.split('.')[1]));
//       if (decoded.role === 'AGENT') {
//         setUser(decoded);
//       }
//     } catch (error) {
//       console.error('JWT decode error:', error);
//       setUser(null);
//     }
//   }, []);

//   const handleLogout = () => {
//     fetch('/api/agent/logout')
//       .then(() => {
//         setUser(null);
//         window.location.href = '/agent/login';
//       });
//   };

//     const renderAuthOptions = () => {
//     if (user && user.role === 'AGENT') {
//       return (
//         <div className="flex items-center space-x-4">
//           <span className="text-gray-700">Hi, {user.email}</span>
//           <Link 
//             href={`/${user.subdomain}/agent/dashboard`}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//           >
//             Go to Dashboard
//           </Link>
//           <button 
//             onClick={handleLogout}
//             className="text-red-600 hover:underline"
//           >
//             Logout
//           </button>
//         </div>
//       );
//     }

//   return (
//     <nav className="bg-white border-b border-gray-200 shadow-sm relative z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">
//           {/* Logo */}
//           <div className="flex-shrink-0">
//             <Link href="/" className="text-xl font-bold text-blue-600">FliprBot</Link>
//           </div>

//           {/* Desktop Menu */}
//           <div className="hidden md:flex space-x-6 items-center">
//             <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
//             <Link href="/customer/chat" className="text-gray-700 hover:text-blue-600">Chatbot</Link>
//             {renderAuthOptions()}
//           </div>

//           {/* Mobile Menu Button */}
//           <div className="md:hidden">
//             <button
//               onClick={() => setIsOpen(!isOpen)}
//               className="text-gray-700 hover:text-blue-600 focus:outline-none"
//             >
//               {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {isOpen && (
//         <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
//           <Link href="/" className="block py-2 text-gray-700 hover:text-blue-600">Home</Link>
//           <Link href="/customer/chat" className="block py-2 text-gray-700 hover:text-blue-600">Chatbot</Link>
          
//           {user && user.role === 'AGENT' ? (
//             <div className="flex flex-col space-y-2 pt-2">
//               <Link 
//                 href={`/${user.subdomain}/agent/dashboard`} 
//                 className="bg-blue-600 text-white px-4 py-2 rounded text-center"
//               >
//                 Go to Dashboard
//               </Link>
//               <button 
//                 onClick={handleLogout}
//                 className="text-red-600 hover:underline text-left"
//               >
//                 Logout
//               </button>
//             </div>
//           ) : (
//             <>
//               <div className="py-2">
//                 <span className="text-sm font-medium text-gray-500">Register</span>
//                 <Link href="/company/register" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Register a Company</Link>
//                 <Link href="/user/register" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Register as a User</Link>
//               </div>
//               <div className="py-2">
//                 <span className="text-sm font-medium text-gray-500">Login</span>
//                 <Link href="/company/login" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Login as Admin</Link>
//                 <Link href="/user/login" className="block px-2 py-1 text-gray-700 hover:text-blue-600">Login as Agent</Link>
//               </div>
//             </>
//           )}
//         </div>
//       )}
//     </nav>
//   );
// }