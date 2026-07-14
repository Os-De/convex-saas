<h1 align="center">
  Convex SaaS
</h1>

<div align="center">
  <p>
  A production-ready Convex Stack for your next SaaS application with Stripe integration, TanStack, Resend, Tailwindcss, and shadcn.
  </p>
</div>

<div align="center">
    <a href="https://convex-saas.netlify.app">Live Demo</a> |  <a href="https://github.com/get-convex/convex-saas/tree/main/docs">Documentation</a>
  <div align="center"><br>
  <a href="https://labs.convex.dev/convex-saas"> <img src="https://github.com/get-convex/convex-saas/blob/v1markchanges/public/images/convexsaas.png" alt="convex saas" /></a>
</div>
   
  </p>
</div>

# Document upload

This fork adds document handling:

- **Documents page** (`/dashboard/documents`): upload, list, download and delete documents stored in Convex file storage. See `src/routes/_app/_auth/dashboard/_layout.documents.tsx` and `convex/documents.ts`.
- **Document uploader** (`/uploader`): a public, standalone page to upload documents and extract their data in the browser — PDF preview, Word (.docx) text extraction, Excel/CSV tables, JSON/text/image preview, with copy and download actions. No login or backend required. See `src/routes/uploader.tsx`.

# Features

Features provided out of the box:

- 🧩 **Convex**: A complete, reactive, typesafe backend with authentication and file storage.
- ⚡ **Vite**: Next-Gen Frontend Tooling.
- 🛍️ **Stripe**: Subscription Plans, Customer Portal, and more.
- 🔑 **Authentication**: Email Code and Social Logins.
- 🎨 **TailwindCSS**: Utility-First CSS Framework.
- 📐 **ShadCN**: Composable React components.
- 🌙 **Easy Theming**: Switch between Light and Dark modes with ease.
- 🗺️ **TanStack Router**: Simple Route Definitions.
- 📧 **Resend**: Email for Developers.
- 💌 **React Email**: Customizable Emails with React.
- 📋 **Conform**: Type-Safe Form Validation based on Web Fundamentals.
- 📥 **File Uploads**: Profile Picture Uploads with Convex.
- 🌐 **I18N**: Internationalization for your App.
- 🧰 **TanStack Development Tools**: Enhanced Development Experience.
- 💅 **Modern UI**: Carefully crafted UI with a Modern Design System.
- 🏕 **Custom Pages**: Landing, Onboarding, Dashboard and Admin Pages.
- 📱 **Responsive**: Works on all devices, from Mobile to Desktop.
-

## [Live Demo](https://convex-saas.netlify.app)

> [!NOTE]
> Convex SaaS is an Open Source Template that is a direct port of the amazing
> work of [Danie