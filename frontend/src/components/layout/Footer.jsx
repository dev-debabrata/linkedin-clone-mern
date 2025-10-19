import React from 'react'

export default function Footer() {

    const currentYear = new Date().getFullYear();

    return (
        <footer>
            <div className="p-4 text-center text-sm text-gray-600 border-t">
                <h1>© Copyright {currentYear} by Debabrata Das | All rights reserved</h1>
            </div>
        </footer>
    );
}
