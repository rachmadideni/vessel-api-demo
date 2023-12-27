export interface MenuAction {
  name: string;
  actions: string[];
}

export interface MenuGroup {
  groupMenu: string;
  menu: MenuAction[];
}

export interface ModifiedJSON {
  permissions: MenuGroup[];
}
