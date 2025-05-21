import { useCallback } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Header() {
  const { toggle } = useSidebar();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggle}
              className="text-gray-500 focus:outline-none focus:text-gray-600 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <i className="ri-menu-line text-2xl"></i>
            </button>
            <h1 className="ml-4 text-lg sm:text-xl font-semibold text-gray-800 capitalize">
              {window.location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 rounded-md focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-600"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <i className="ri-search-line"></i>
              </div>
            </div>

            <button className="p-1 text-gray-500 rounded-full hover:text-gray-600" aria-label="Notifications">
              <i className="ri-notification-3-line text-xl"></i>
            </button>

            <button className="p-1 text-gray-500 rounded-full hover:text-gray-600" aria-label="Settings">
              <i className="ri-settings-3-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
