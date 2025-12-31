import pandas as pd
import json

excel_file = 'FASE DE GRUPOS.xlsx'

try:
    # Read all sheets
    xls = pd.ExcelFile(excel_file)
    sheets = xls.sheet_names
    
    all_data = {}
    
    for sheet_name in sheets:
        df = pd.read_excel(xls, sheet_name=sheet_name)
        # Convert to dictionary (records)
        all_data[sheet_name] = df.to_dict(orient='records')
        print(f"--- SHEET: {sheet_name} ---")
        print(df.to_string())
        print("\n")

except Exception as e:
    print(f"Error reading Excel: {e}")
