export interface ISubOverideParam {
  prefix?: string,
  type?: string,
  name?: string,
  typing?: string,
  desc?: string,
  default?: string,
  optional?: boolean,
}

export interface IOverideParam {
  prefix?: string,
  type?: string,
  name?: string,
  typing?: string,
  desc?: string,
  default?: string,
  optional?: boolean,
  args?: { [param: string]: ISubOverideParam },
}

export interface IOverideReturn {
  prefix?: string,
  type?: string,
  typing?: string,
  desc?: string,
  default?: string,
  args?: { [param: string]: ISubOverideParam },
}

export interface IOverride {
  prefix?: string,
  overload?: string[],
  params?: {
    [param: string]: IOverideParam,
  },
  returns?: IOverideReturn[],
}

export interface IOverrides {
  global: {
    typings: string[],
    context: { [namespace: string]: string },
    structure: { [namespace: string]: string },
    self: { [namespace: string]: string },
    enum: { [namespace: string]: string },
    extend: { [namespace: string]: string[] },
  },

  func: {
    [name: string]: IOverride,
  },
}

const overrides: IOverrides = {
  global: {
    typings: [
      'declare const SERVER: boolean',
      'declare const CLIENT: boolean',
      'declare const MENU: boolean',
      'declare const GAMEMODE: Gamemode',
      'declare const GM: Gamemode',

      'declare const SWEP: SWEP',
      'declare const ENT: _TOOL',
      'declare const TOOL: _ENTITY',
      'declare const SANDBOX: _SANDBOX',
      'declare const EFFECT: _EFFECT',

      'type _SWEP    = WeaponHooks',
      'type _TOOL    = ToolHooks',
      'type _ENTITY  = EntityHooks',
      'type _SANDBOX = SandboxHooks',
      'type _EFFECT  = EffectHooks',

      'type Gamemode = IGamemode & GamemodeHooks',
      'type Color = IColor & ColorFuncs',
      'type Angle = IAngle & AngleFuncs',
      'type Vector = IVector & VectorFuncs',
      'type Entity = IEntity & EntityFuncs',
      'type Weapon = IWeapon & WeaponFuncs',
      'type Tool   = ITool & ToolFuncs',

      'declare interface IVector { x: number, y: number,  z: number }',
      'declare interface IAngle { pitch: number, yaw: number, roll: number, p: number, y: number,  r: number }',

      'type UnknownFunc = (this: void, ...args: any[]) => unknown',
      'type thread = any',
      'type userdata = any',
      'type sensor = any',
      'type pixelvis_handle_t = any',

      'interface table { [key: string]: any; }',

      'declare interface Awesomium extends Panel {}',
      'declare interface AvatarImage extends Panel {}',
      'declare interface Button extends DLabel {}',
      'declare interface CheckButton extends Panel {}',
      'declare interface CheckButton {}',
      'declare interface DCategoryHeader extends DButton {}',
      'declare interface DListBox extends DPanelList {}',
      'declare interface DListBoxItem extends DLabel {}',
      'declare interface DListLayout extends DDragBase {}',
      'declare interface DListViewHeaderLabel extends DLabel {}',
      'declare interface DListViewLabel extends DLabel {}',
      'declare interface DListViewLine extends Panel {}',
      'declare interface DListView_ColumnPlain extends Panel {}',
      'declare interface DListView_DraggerBar extends DButton {}',
      'declare interface DModelSelectMulti extends DPropertySheet {}',
      'declare interface DNumPad extends DPanel {}',
      'declare interface DPanelSelect extends DPanelList {}',
      'declare interface DProperty_Boolean extends DProperty_Generic {}',
      'declare interface DProperty_Float extends DProperty_Generic {}',
      'declare interface DProperty_Generic extends Panel {}',
      'declare interface DProperty_Int extends DProperty_Float {}',
      'declare interface DScrollBarGrip extends DPanel {}',
      'declare interface DTab extends DButton {}',
      'declare interface DTree_Node_Button extends DButton {}',
      'declare interface EditablePanel extends Panel {}',
      'declare interface FingerVar extends Panel {}',
      'declare interface HTML extends Panel {}',
      'declare interface Label extends Panel {}',
      'declare interface MatSelect extends ContextBase {}',
      'declare interface ModelImage extends Panel {}',
      'declare interface PanelList extends Panel {}',
      'declare interface PresetEditor extends DFrame {}',
      'declare interface PresetEditor extends DFrame {}',
      'declare interface PropSelect extends ContextBase {}',
      'declare interface RadioButton {}',
      'declare interface RichText extends Panel {}',
      'declare interface SlideBar extends Panel {}',
      'declare interface Slider extends Panel {}',
      'declare interface SpawnIcon extends DButton {}',
      'declare interface TGAImage extends Panel {}',
      'declare interface TextEntry extends Panel {}',
      'declare interface URLLabel extends Panel {}',
      'declare interface fingerposer extends ContextBase {}',
    ],

    self: {
      'WeaponFuncs': 'Weapon',
      'EntityFuncs': 'Entity',
      'AngleFuncs': 'Angle',
      'VectorFuncs': 'Vector',

      'WeaponHooks': 'Weapon',
      'PanelHooks': 'Panel',
      'GamemodeHooks': 'Gamemode',
      'PlayerHooks': 'Player',

      'EffectHooks': '_EFFECT',
      'EntHooks': '_ENT',
      'EntityHooks': '_ENTITY',
      'SandboxHooks': '_SANDBOX',
      'ToolHooks': '_TOOL',
    },

    extend: {
      'Vehicle': ['Entity'],
      'NPC': ['Entity'],
      'WeaponFuncs': ['Entity'],
      'ToolFuncs': ['Entity'],
      'PlayerFuncs': ['Entity'],
      'PlayerHooks': ['Player'],
      'SandboxHooks': ['Gamemode'],

      'ContentIcon': ['DButton'],
      'ContextBase': ['Panel'],
      'ControlPanel': ['DForm'],
      'ControlPresets': ['Panel'],
      'DAdjustableModelPanel': ['DModelPanel'],
      'DAlphaBar': ['DPanel'],
      'DBinder': ['DButton'],
      'DBubbleContainer': ['DPanel'],
      'DButton': ['DLabel'],
      'DButton2': ['DLabel'],
      'DCategoryList': ['DScrollPanel'],
      'DCheckBox': ['DButton'],
      'DCheckBoxLabel': ['DPanel'],
      'DCollapsibleCategory': ['Panel'],
      'DColorButton': ['DLabel'],
      'DColorCombo': ['DPropertySheet'],
      'DColorCube': ['DSlider'],
      'DColorMixer': ['DPanel'],
      'DColorPalette': ['DIconLayout'],
      'DColumnSheet': ['Panel'],
      'DComboBox': ['DButton'],
      'DDragBase': ['DPanel'],
      'DDrawer': ['Panel'],
      'DEntityProperties': ['DProperties'],
      'DExpandButton': ['DButton'],
      'DFileBrowser': ['DPanel'],
      'DForm': ['DCollapsibleCategory'],
      'DFrame': ['EditablePanel'],
      'DGrid': ['Panel'],
      'DHTML': ['Awesomium'],
      'DHTMLControls': ['Panel'],
      'DHorizontalDivider': ['DPanel'],
      'DHorizontalScroller': ['Panel'],
      'DIconBrowser': ['DScrollPanel'],
      'DIconLayout': ['DDragBase'],
      'DImage': ['DPanel'],
      'DImageButton': ['DButton'],
      'DKillIcon': ['Panel'],
      'DLabel': ['Label'],
      'DLabelEditable': ['DLabel'],
      'DLabelURL': ['URLLabel'],
      'DListView': ['DPanel'],
      'DListView_Column': ['DPanel'],
      'DListView_Line': ['Panel'],
      'DMenu': ['DScrollPanel'],
      'DMenuBar': ['DPanel'],
      'DMenuOption': ['DButton'],
      'DMenuOptionCVar': ['DMenuOption'],
      'DModelPanel': ['DButton'],
      'DModelSelect': ['DPanelSelect'],
      'DNotify': ['Panel'],
      'DNumSlider': ['Panel'],
      'DNumberScratch': ['DImageButton'],
      'DNumberWang': ['DTextEntry'],
      'DPanel': ['Panel'],
      'DPanelList': ['DPanel'],
      'DPanelOverlay': ['DPanel'],
      'DProgress': ['Panel'],
      'DProperties': ['Panel'],
      'DPropertySheet': ['DPanel'],
      'DProperty_Combo': ['DProperty_Generic'],
      'DProperty_VectorColor': ['DProperty_Generic'],
      'DRGBPicker': ['DPanel'],
      'DScrollPanel': ['DPanel'],
      'DShape': ['DPanel'],
      'DSlider': ['DPanel'],
      'DSprite': ['DPanel'],
      'DTextEntry': ['TextEntry'],
      'DTileLayout': ['DDragBase'],
      'DTooltip': ['DLabel'],
      'DTree': ['DScrollPanel'],
      'DTree_Node': ['DPanel'],
      'DVScrollBar': ['Panel'],
      'DVerticalDivider': ['DPanel'],
      'IconEditor': ['DFrame'],
      'ImageCheckBox': ['Button'],
      'Material': ['Button'],
    },

    context: {
      'EFFECT': 'EffectHooks',
      'ENT': 'EntHooks',
      'ENTITY': 'EntityHooks',
      'PLAYER': 'PlayerHooks',
      'WEAPON': 'WeaponHooks',
      'SWEP': 'WeaponHooks',
      'PANEL': 'PanelHooks',
      'GM': 'GamemodeHooks',
      'SANDBOX': 'SandboxHooks',
      'TOOL': 'ToolHooks',

      'Weapon': 'WeaponFuncs',
      'Entity': 'EntityFuncs',
      'Angle': 'AngleFuncs',
      'Vector': 'VectorFuncs',
      'Color': 'ColorFuncs',
      'Tool': 'ToolFuncs',
    },

    structure: {
      'Color': 'IColor',
      'GM': 'IGamemode',
      'ENT': 'IEntity',
      'SWEP': 'IWeapon',
      'TOOL': 'ITool',
    },

    enum: {
      'PLAYER': 'PLAYER_ANIM'
    }
  },
  func: {
    'ToolFuncs/GetPos': {
      params: {
        'id': { optional: true },
      },
    },
    'ToolFuncs/GetLocalPos': {
      params: {
        'id': { optional: true },
      },
    },
    'DFrame/SetIcon': {
      params: {
        'path': { type: 'string | SpawnIcon' },
      },
    },
    'Panel/SetSelected': {
      params: {
        'selected': { type: 'number | boolean' },
      },
    },
    'DTextEntry/SetValue': {
      params: {
        'text': { type: 'string | number' },
      },
    },
    'DImageButton/SetImage': {
      params: {
        'strBackup': { optional: true },
      },
    },
    'DImage/PaintAt': {
      params: {
        'width': { optional: true },
        'height': { optional: true },
      },
    },
    'Panel/DHTMLControls': {
      params: {
        'HTML_Code': { type: 'string | Panel' },
      },
    },
    'Panel/SetHTML': {
      params: {
        'HTML_code': { type: 'string | Panel' },
      },
    },
    'DColorButton/SetColor': {
      params: {
        'noTooltip': { optional: true },
      },
    },
    'Panel/SetName': {
      params: {
        'this': { type: 'Panel | DForm' },
      },
    },
    'Panel/Add': {
      params: {
        'object': { type: 'string | Panel' },
      },
    },
    'jit/attach': {
      params: { 'callback': { type: 'any' } },
    },
    'spawnmenu/AddPropCategory': {
      params: { 'contents': { type: 'any' } },
    },
    'Global/AddCSLuaFile': {
      params: { 'file': { optional: true } },
    },
    'Global/IncludeCS': {
      params: { 'filename': { optional: true } },
    },
    'Global/CreateConVar': {
      params: { 'helptext': { optional: true } },
    },
    'concommand/Add': {
      params: {
        'autoComplete': { optional: true },
        'helpText': { optional: true },
        'flags': { optional: true },
        'callback': {
          args: {
            'args': {
              type: 'string[]'
            }
          }
        }
      },
    },
    'Panel/SetFGColor': {
      params: {
        'r_or_color': {
          name: 'r',
          type: 'number | Color'
        },
        'g': { optional: true },
        'b': { optional: true },
        'a': { optional: true },
      },
    },
    'Panel/SetBGColor': {
      params: {
        'r_or_color': {
          name: 'r',
          type: 'number | Color'
        },
        'g': { optional: true },
        'b': { optional: true },
        'a': { optional: true },
      },
    },
  }
}

export default overrides
