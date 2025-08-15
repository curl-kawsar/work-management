# Work Management System

A comprehensive work order management dashboard built with Next.js, featuring role-based access control, invoice management, and detailed reporting capabilities.

## 🚀 Features

### ✅ **Core Functionality**
- **User Authentication**: Secure login/registration with NextAuth.js
- **Role-Based Access**: Admin and Staff roles with different permissions
- **Work Order Management**: Complete CRUD operations with file attachments
- **Invoice System**: Comprehensive financial tracking with expense breakdown
- **Dashboard Analytics**: Role-specific metrics and performance tracking
- **Advanced Reporting**: PDF/Excel export with multiple report types
- **Activity Logging**: Complete audit trail of all user actions
- **Email Verification**: Secure work order deletion with email confirmation

### 🔐 **Security Features**
- **Authentication**: NextAuth.js with credentials provider
- **Authorization**: Role-based access control (Admin/Staff)
- **Password Security**: Bcrypt hashing
- **Session Management**: JWT-based sessions
- **Input Validation**: Yup schema validation
- **Activity Tracking**: Comprehensive audit logs

### 📊 **Reporting & Analytics**
- **Overview Reports**: System-wide metrics and trends
- **Financial Reports**: Revenue, expenses, and profit analysis
- **Staff Performance**: Individual performance tracking
- **Work Order Reports**: Status distribution and overdue tracking
- **Company-Based Filtering**: Filter reports by company
- **Export Options**: PDF and Excel export capabilities

## 🛠️ Technology Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Frontend**: React 19, TailwindCSS 4, Framer Motion
- **Backend**: Next.js API routes with MongoDB
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose ODM
- **UI Components**: Lucide React icons, custom components
- **Forms**: React Hook Form with Yup validation
- **Charts**: Recharts for data visualization
- **Export**: jsPDF and XLSX for report generation
- **Email**: Nodemailer for notifications

## 📋 Prerequisites

- Node.js 18+
- MongoDB database
- SMTP email service (for deletion confirmations)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd work-management
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your settings:
```bash
cp .env.example .env.local
```

Configure the following environment variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/work-management

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 👥 User Roles & Permissions

### **Admin Role**
- ✅ Full system access
- ✅ User management capabilities
- ✅ All work orders and invoices
- ✅ Advanced reporting and analytics
- ✅ Activity logs access
- ✅ Work order deletion with email verification

### **Staff Role**
- ✅ Assigned work orders only
- ✅ Invoice creation and editing
- ✅ Personal dashboard
- ✅ Limited reporting access
- ❌ User management
- ❌ System-wide analytics

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── work-orders/       # Work order management
│   ├── invoices/          # Invoice management
│   ├── reports/           # Reporting system
│   ├── activity-logs/     # Activity tracking
│   └── users/             # User management
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   ├── work-orders/      # Work order components
│   └── reports/          # Report components
├── lib/                  # Utility libraries
│   ├── mongodb.js        # Database connection
│   ├── activityLogger.js # Activity logging
│   └── emailService.js   # Email utilities
└── models/               # Database models
    ├── User.js           # User model
    ├── WorkOrder.js      # Work order model
    ├── Invoice.js        # Invoice model
    └── ActivityLog.js    # Activity log model
```

## 🔧 Key Features Implementation

### Work Order Management
- **Create**: All required fields with file upload support
- **Edit**: Role-based editing permissions
- **Delete**: Admin-only with email verification
- **Status Tracking**: Created → Ongoing → Completed workflow
- **File Attachments**: Photo/video upload support
- **Activity Notes**: Time-stamped updates

### Invoice System
- **Income Tracking**: Multiple payment methods support
- **Expense Management**: Material, Labor, Utility costs
- **Revenue Calculation**: Automatic profit/loss calculation
- **Status Management**: Draft → Sent → Paid → Overdue
- **PDF Generation**: Professional invoice PDFs

### Activity Logging
- **Complete Audit Trail**: All user actions tracked
- **Detailed Information**: Before/after values for changes
- **User Attribution**: Track who made what changes
- **Timestamp Logging**: Precise action timing
- **Admin Dashboard**: View all system activity

### Email Verification System
- **Secure Deletion**: Email verification for work order deletion
- **Time-Limited Codes**: 10-minute expiration
- **Professional Templates**: HTML email templates
- **Error Handling**: Comprehensive error management

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Database Models

### User Model
- Authentication and role management
- Password hashing with bcrypt
- Admin/Staff role differentiation

### WorkOrder Model
- Complete work order lifecycle
- File attachment support
- Activity tracking with timestamps
- Staff assignment and status management

### Invoice Model
- Financial tracking and calculations
- Multiple payment methods
- Expense categorization
- Revenue calculation

### ActivityLog Model
- Complete audit trail
- User action tracking
- Before/after value storage
- Timestamp and IP logging

## 🔒 Security Considerations

- **Authentication**: Secure login with NextAuth.js
- **Authorization**: Role-based access control
- **Data Validation**: Server-side validation with Yup
- **Password Security**: Bcrypt hashing
- **Session Management**: Secure JWT tokens
- **Activity Logging**: Complete audit trail
- **Email Verification**: Secure deletion process

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the activity logs for debugging
- Contact the system administrator

---

**Work Management System** - Streamline your work order and invoice management with comprehensive tracking and reporting.
