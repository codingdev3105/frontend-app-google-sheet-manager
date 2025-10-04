import * as React from "react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";

export default function RadioGroupe({ list = [], onChange ,title = '' }) {
  const [selected, setSelected] = React.useState(list[0] || "");

  const handleChange = (event) => {
    setSelected(event.target.value);
    if (onChange) onChange(event.target.value);
  };

  return (
    <FormControl>
      <FormLabel id="radio-label">{title} </FormLabel>
      <RadioGroup
        row
        aria-labelledby="radio-label"
        name="row-radio-buttons-group"
        value={selected}
        onChange={handleChange}
      >
        {list.map((item, i) => (
          <FormControlLabel
            key={i}
            value={item}
            control={<Radio />}
            label={item}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}
