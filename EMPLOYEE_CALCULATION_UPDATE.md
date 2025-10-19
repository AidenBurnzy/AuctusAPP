# Employee Payroll Calculation Update

## What Changed

The employee payroll calculation now properly works from the **Employee Allocation Pool** instead of directly from Net Income, exactly matching your Google Sheets logic.

---

## New Calculation Flow

### **Before (Incorrect):**
```
1. Net Income = $320.65
2. Aiden gets 60% of Net Income = $192.39 ❌
3. Nick gets 40% of Net Income = $128.26 ❌
```

### **After (Correct - Matches Your Google Sheets):**
```
1. Gross Income = $470.00
   (Global Windows $420 + Nightmare Racing $50)

2. Subscriptions Cost = $149.35
   (Claude $91.35 + Neon $5 + Elevenlabs $5 + Github $8 + Github AI $20 + Netlify $20)

3. Net Income = $320.65
   (Gross Income - Subscriptions)

4. Budget Allocations (from Net Income):
   • To Savings (35%) = $112.23
   • To Checking (35%) = $112.23
   • To Employees (30%) = $96.20 ← Employee Pool

5. Employee Payroll (from Employee Pool of $96.20):
   • Aiden (60% of $96.20) = $57.72/month → $692.60/year ✅
   • Nick (40% of $96.20) = $38.48/month → $461.74/year ✅
```

---

## How It Works

### **Automatic Detection**
The system automatically finds your "To Employees" allocation by looking for budget allocations with "employee" or "payroll" in the category name:
- "To Employees" ✅
- "Employee Payroll" ✅
- "Payroll Budget" ✅
- "Employees" ✅

### **Employee Pool Display**
When viewing the Employee Payroll section, you'll now see:
```
Employee Pool: $96.20 (30% of Net Income)
Employee percentages are calculated from this pool amount.
```

### **Clear Modal Instructions**
When adding or editing an employee, the modal now shows:
- **Note:** Employee percentages are calculated from the "To Employees" budget allocation pool, not from total net income.
- **Label:** "Income Percentage * (% of Employee Pool)"

---

## Setup Instructions

### **Step 1: Create Budget Allocation**
1. Go to Finances page
2. In the "Budget Allocation" section, click "+ Add Allocation"
3. Enter:
   - **Category:** "To Employees" (or any name with "employee" or "payroll")
   - **Percentage:** 30 (or whatever % you want for payroll)
4. Click "Add"

### **Step 2: Add Employees**
1. In the "Employee Payroll" section, click "+ Add Employee"
2. Enter:
   - **Name:** "Aiden"
   - **Percentage:** 60 (this is 60% of the employee pool, not net income)
3. Click "Add"
4. Repeat for Nick with 40%

### **Results:**
- **Employee Pool:** $96.20 (30% of $320.65 net income)
- **Aiden:** $57.72/month (60% of $96.20) = $692.60/year
- **Nick:** $38.48/month (40% of $96.20) = $461.74/year

---

## Flexibility

### **What if I don't have an employee allocation?**
If no "To Employees" allocation exists, the system falls back to calculating employee percentages directly from Net Income (old behavior). This ensures the system still works even if you haven't set up allocations yet.

### **What if employee percentages don't add up to 100%?**
That's fine! You could have:
- Aiden: 60%
- Nick: 40%
- Total: 100% of employee pool ✅

Or:
- Aiden: 50%
- Nick: 30%
- Total: 80% of employee pool (20% unallocated) ✅

### **Can I have multiple employee allocations?**
The system will use the first allocation it finds with "employee" or "payroll" in the name. If you want to be specific, name it exactly "To Employees".

---

## Benefits

✅ **Matches Google Sheets exactly** - Same calculation logic
✅ **Two-tier allocation** - Allocate to categories first, then distribute within categories
✅ **Flexible budgeting** - Easily adjust employee pool size by changing allocation percentage
✅ **Clear visibility** - See the employee pool amount on the dashboard
✅ **Automatic calculation** - All amounts update when you change allocations

---

## Example Scenarios

### **Scenario 1: Increase Employee Pool**
Change "To Employees" from 30% to 40%:
- Employee Pool: $128.26 (40% of $320.65)
- Aiden (60%): $76.96/month = $923.52/year
- Nick (40%): $51.30/month = $615.68/year

### **Scenario 2: Change Employee Split**
Change Aiden to 70% and Nick to 30%:
- Employee Pool: $96.20 (still 30% of net income)
- Aiden (70%): $67.34/month = $808.08/year
- Nick (30%): $28.86/month = $346.32/year

### **Scenario 3: Add Third Employee**
Add a third partner at 20%, adjust others:
- Aiden: 50%
- Nick: 30%
- New Partner: 20%
- Total: 100% of $96.20 employee pool

---

## Deployed! 🚀

The change has been deployed. Once Netlify finishes deploying, refresh your app and the employee payroll will calculate correctly from the employee allocation pool!
