def categorize(description):
    desc = description.lower()

    # Income category
    if "payroll" in desc or "deposit" in desc or "lauren concrete" in desc or "paycheck" in desc:
        return "Income"
    
    if "heb" in desc or "h-e-b" in desc or "wal-mart" in desc or "walmart" in desc or "whole foods" in desc:
        return "Groceries"
    
    if "amazon" in desc or "zara" in desc or "pacsun" in desc or "target" in desc:
        return "Retail"
    
    if "poke" in desc or "sushi" in desc or "restaurant" in desc or "drive in" in desc or "mcdonald" in desc or "starbucks" in desc:
        return "Dining"
    
    if "prime" in desc or "kindle" in desc or "netflix" in desc or "spotify" in desc or "hulu" in desc:
        return "Subscriptions"
    
    if "htown" in desc or "qt" in desc or "uber" in desc or "lyft" in desc:
        return "Travel"
    
    if "render.com" in desc or "domain" in desc or "godaddy" in desc:
        return "Online Services"

    return "Other"
