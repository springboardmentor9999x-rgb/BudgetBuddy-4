function FilterBar({



    value,



    onChange



}){



    return(



        <select



            className="form-select"



            value={value}



            onChange={(e)=>



                onChange(e.target.value)



            }



        >



            <option value="">



                All



            </option>



            <option value="Income">



                Income



            </option>



            <option value="Expense">



                Expense



            </option>



        </select>



    );



}



export default FilterBar;