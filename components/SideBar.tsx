"use client";

import MenuIcon from "@mui/icons-material/Menu";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";

import { Box, Button, Divider, Drawer, IconButton, List } from "@mui/material";
import { useState } from "react";
import SideBarItem from "./SideBarItem";
import { Logout } from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const DRAWER_OPEN_WIDTH = 220;
const DRAWER_CLOSED_WIDTH = 60;

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <SpaceDashboardOutlinedIcon />,
  },
];

export default function SideBar() {
  const { logout } = useAuth();
  const { replace } = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const drawerWidth = isSidebarOpen ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    } finally {
      replace("/signin");
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        transition: (theme) =>
          theme.transitions.create("width", {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.shorter,
          }),
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          overflow: "hidden",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.shorter,
            }),
        },
      }}
    >
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 1,
        }}
      >
        <IconButton
          color="primary"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
        >
          <MenuIcon />
        </IconButton>
      </Box>
      <Divider />
      <List
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 1,
          px: 1,
        }}
      >
        {navItems.map((item) => (
          <SideBarItem
            {...item}
            key={item.href}
            isSidebarOpen={isSidebarOpen}
          />
        ))}
      </List>
      <Button
        variant={"outlined"}
        color={"error"}
        disableElevation
        sx={{
          textTransform: "capitalize",
          mx: 1,
          mb: 1.5,
          display: isSidebarOpen ? "flex" : "none",
        }}
        startIcon={<Logout />}
        onClick={handleLogout}
      >
        Logout
      </Button>
    </Drawer>
  );
}
