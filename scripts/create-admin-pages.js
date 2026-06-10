const fs = require('fs');
const path = require('path');

const pages = [
  'app/admin/users/page.tsx',
  'app/admin/users/new/page.tsx',
  'app/admin/users/[userName]/page.tsx',
  'app/admin/games/page.tsx',
  'app/admin/games/new/page.tsx',
  'app/admin/games/[id]/edit/page.tsx',
  'app/admin/services/page.tsx',
  'app/admin/services/new/page.tsx',
  'app/admin/services/[id]/edit/page.tsx',
  'app/admin/services/[id]/preview/page.tsx',
  'app/admin/orders/page.tsx',
  'app/admin/orders/[id]/page.tsx',
  'app/admin/transactions/page.tsx',
  'app/admin/content/page.tsx',
  'app/admin/content/[id]/edit/page.tsx',
  'app/admin/messages/page.tsx',
  'app/admin/messages/[ticketId]/page.tsx',
  'app/admin/logs/page.tsx',
  'app/admin/settings/page.tsx',
  'app/admin/login/page.tsx'
];

function getTemplate(pagePath) {
  const isDynamic = pagePath.includes('[id]') || pagePath.includes('[ticketId]') || pagePath.includes('[userName]');
  const isLogin = pagePath.includes('login');
  
  const componentName = pagePath
    .replace('app/admin/', '')
    .replace('/page.tsx', '')
    .replace(/\//g, '_')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/-/g, '_')
    .replace(/(^\w|_\w)/g, m => m.replace('_', '').toUpperCase());

  const title = pagePath
    .replace('app/admin/', '')
    .replace('/page.tsx', '')
    .replace(/\//g, ' &gt; ');

  if (isLogin) {
    return `import React from "react";

export default function AdminLogin() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050816]">
      <div className="w-[400px] p-8 bg-[#0F172A] border border-[#172554] rounded-xl text-center">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Terminal Login</h1>
        <p className="text-[#94A3B8] text-sm">Placeholder for login page</p>
      </div>
    </div>
  );
}
`;
  }

  if (isDynamic) {
    return `import React from "react";

export default async function ${componentName}Page({ params }: { params: Promise<{ id?: string, ticketId?: string, userName?: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-xs text-[#94A3B8] font-medium mb-1">Admin &gt; ${title}</div>
      <h1 className="text-3xl font-bold text-white mb-6 font-display">${componentName} Page</h1>
      <div className="bg-[#0F172A] border border-[#172554] rounded-xl p-6 text-[#94A3B8]">
        <p>This is a placeholder for the ${componentName} page.</p>
        <p>Dynamic Param ID: {resolvedParams.id || resolvedParams.ticketId || resolvedParams.userName}</p>
      </div>
    </div>
  );
}
`;
  }

  return `import React from "react";

export default function ${componentName}Page() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-xs text-[#94A3B8] font-medium mb-1">Admin &gt; ${title}</div>
      <h1 className="text-3xl font-bold text-white mb-6 font-display">${componentName} Page</h1>
      <div className="bg-[#0F172A] border border-[#172554] rounded-xl p-6 text-[#94A3B8]">
        <p>This is a placeholder for the ${componentName} page.</p>
      </div>
    </div>
  );
}
`;
}

pages.forEach(page => {
  const fullPath = path.join(__dirname, '..', page);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, getTemplate(page));
  console.log('Created:', fullPath);
});
