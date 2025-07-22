import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ListMenu({
  mediaDevices,
  kind,
}: {
  mediaDevices: MediaDeviceInfo[];
  kind: string;
}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <button
        className="text-white px-2 flex justify-center items-center"
        id="basic-button"
        onClick={handleClick}
      >
        {anchorEl ? <ChevronUp /> : <ChevronDown />}
      </button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "basic-button",
          },
        }}
      >
        {mediaDevices &&
          mediaDevices.length > 0 &&
          mediaDevices
            .filter((d) => d.kind === kind)
            .map((device) => (
              <MenuItem onClick={handleClose}>{device.label}</MenuItem>
            ))}
      </Menu>
    </div>
  );
}
