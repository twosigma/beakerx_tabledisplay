/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { CellRenderer, GraphicsContext, TextRenderer } from '@lumino/datagrid';
import { Theme } from '../../../utils';
import { BeakerXDataGrid } from '../../BeakerXDataGrid';
import { DEFAULT_ALIGNMENT } from '../../column/ColumnAlignment';
import { DataGridHelpers } from '../../Helpers';
import { IRenderer, RENDERER_TYPE } from '../../interface/IRenderer';
import { BeakerXDataStore } from '../../store/BeakerXDataStore';
import { DataGridStyle } from '../../style/DataGridStyle';
import { DataGridCell } from '../DataGridCell';

export interface ICellRendererOptions {
  font?: string;
  color?: string;
  text?: any;
  vAlign?: string;
  hAlign?: CanvasTextAlign;
  boxHeight?: number;
  textHeight?: number;
}

const TEXT_WIDTH_OFFSET = 8;

export abstract class BeakerXCellRenderer extends TextRenderer {
  store: BeakerXDataStore;
  dataGrid: BeakerXDataGrid;
  backgroundColor: CellRenderer.ConfigOption<string>;
  horizontalAlignment: CellRenderer.ConfigOption<TextRenderer.HorizontalAlignment>;
  format: TextRenderer.FormatFunc;
  font: CellRenderer.ConfigOption<string>;
  textColor: CellRenderer.ConfigOption<string>;

  constructor(dataGrid: BeakerXDataGrid, options?: TextRenderer.IOptions) {
    super(options);

    this.store = dataGrid.store;
    this.dataGrid = dataGrid;
    this.backgroundColor = this.getBackgroundColor.bind(this);
    this.horizontalAlignment = this.getHorizontalAlignment.bind(this);
    this.format = this.getFormat.bind(this);
    this.font = this.getFont.bind(this);
    this.textColor = this.getTextColor.bind(this);
  }

  drawBackground(gc: GraphicsContext, config: CellRenderer.CellConfig) {
    super.drawBackground(gc, config);

    const renderer = this.getRenderer(config);
    const isHeaderCell = DataGridCell.isHeaderCell(config);

    if (renderer && renderer.type === RENDERER_TYPE.DataBars && !isHeaderCell) {
      const barWidth = (config.width / 2) * renderer.percent;

      gc.fillStyle = Theme.DATA_BARS_COLOR;
      gc.fillRect(
        config.x + config.width / 2 - (renderer.direction === 'RIGHT' ? 0 : barWidth),
        config.y,
        barWidth,
        config.height - 1,
      );
    }
  }

  drawTextUnderline(gc: GraphicsContext, textConfig, config) {
    const { text, textY, color } = textConfig;
    let { textX } = textConfig;
    const url = DataGridHelpers.retrieveUrl(text);

    if (!url) {
      return;
    }

    let underlineEndX: number;
    let underlineStartX: number;
    const urlIndex = text.indexOf(url);
    const firstPart = urlIndex > 0 ? text.slice(0, urlIndex) : '';
    const fontSize = this.store.selectDataFontSize();
    const textWidth: number = DataGridHelpers.getStringSize(text, fontSize).width - TEXT_WIDTH_OFFSET;
    const firstPartWidth = DataGridHelpers.getStringSize(firstPart, fontSize).width - TEXT_WIDTH_OFFSET;
    const hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config);

    // Compute the X position for the underline.
    switch (hAlign) {
      case 'left':
        underlineEndX = Math.round(textX + textWidth);
        underlineStartX = Math.round(textX + firstPartWidth);
        break;
      case 'center':
        textX = config.x + config.width / 2 - textWidth / 2;
        underlineEndX = Math.round(textX + textWidth);
        underlineStartX = textX + firstPartWidth;
        break;
      case 'right':
        underlineEndX = Math.round(textX - textWidth + firstPartWidth);
        underlineStartX = textX;
        break;
      default:
        throw 'unreachable';
    }

    gc.beginPath();
    gc.moveTo(underlineStartX, textY - 0.5);
    gc.lineTo(underlineEndX, textY - 0.5);
    gc.strokeStyle = color;
    gc.lineWidth = 1.0;
    gc.stroke();
  }

  getBackgroundColor(config: CellRenderer.CellConfig): string {
    const selectionColor = this.dataGrid.cellSelectionManager.getBackgroundColor(config);
    const highlighterColor = this.dataGrid.highlighterManager.getCellBackground(config);
    const focusedColor = this.dataGrid.cellFocusManager.getFocussedCellBackground(config);
    const initialColor = selectionColor && highlighterColor && DataGridStyle.darken(highlighterColor);
    
    return (
      focusedColor ||
      selectionColor ||
      highlighterColor ||
      initialColor ||
      Theme.DEFAULT_COLOR
    );
  }

  getHorizontalAlignment(config: CellRenderer.CellConfig): string {
    const column = this.dataGrid.getColumn(config);

    return column ? column.getAlignment() : DEFAULT_ALIGNMENT;
  }

  getFormat(config: CellRenderer.CellConfig) {
    const column = this.dataGrid.getColumn(config);

    return DataGridCell.isHeaderCell(config) ? config.value : column.formatFn(config);
  }

  getFont({ region }): string {
    const fontSize =
      region === 'column-header' || region === 'corner-header'
        ? this.store.selectHeaderFontSize()
        : this.store.selectDataFontSize();

    return `normal ${fontSize || DataGridStyle.DEFAULT_DATA_FONT_SIZE}px Lato, Helvetica, sans-serif`;
  }

  getTextColor(config): string {
    if (
      config.region === 'row-header' ||
      config.region === 'column-header' ||
      config.region === 'corner-header'
    ) {
      return Theme.DEFAULT_HEADER_FONT_COLOR;
    }
    
    if (
      config.region === 'body' &&
      this.dataGrid.rowManager.rows[config.row] &&
      this.dataGrid.rowManager.rows[config.row].cells &&
      this.dataGrid.rowManager.rows[config.row].cells[config.column].fontColor
    ) {
      return DataGridStyle.formatColor(this.dataGrid.rowManager.rows[config.row].cells[config.column].fontColor);
    } 

    return Theme.DEFAULT_DATA_FONT_COLOR;
  }

  getRenderer(config: CellRenderer.CellConfig): IRenderer | undefined {
    const column = this.dataGrid.getColumn(config);
    const renderer = this.store.selectRenderer(column);
    const valueResolver = column.getValueResolver();

    return {
      ...renderer,
      percent: Math.abs(parseFloat(valueResolver(config.value))) / column.maxValue,
      direction: valueResolver(config.value) > 0 ? 'RIGHT' : 'LEFT',
    };
  }

  getOptions(config: CellRenderer.CellConfig): ICellRendererOptions {
    const result: ICellRendererOptions = {};

    // Resolve the font for the cell.
    result.font = CellRenderer.resolveOption(this.font, config);

    // Bail if there is no font to draw.
    if (!result.font) {
      return result;
    }
    
    // Resolve the text color for the cell.
    result.color = CellRenderer.resolveOption(this.textColor, config);

    // Bail if there is no text color to draw.
    if (!result.color) {
      return result;
    }

    // Format the cell value to text.
    const format = this.format;
    result.text = format(config);

    if (result.text === null) {
      return result;
    }

    // Resolve the vertical and horizontal alignment.
    result.vAlign = CellRenderer.resolveOption(this.verticalAlignment, config);
    result.hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config);

    // Compute the padded text box height for the specified alignment.
    result.boxHeight = config.height - (result.vAlign === 'center' ? 1 : 2);

    // Bail if the text box has no effective size.
    if (result.boxHeight <= 0) {
      return result;
    }

    // Compute the text height for the gc font.
    result.textHeight = TextRenderer.measureFontHeight(result.font);

    return result;
  }

  getTextPosition(
    config: CellRenderer.CellConfig,
    options: ICellRendererOptions,
    isHeaderCell = false,
  ): { textX: number; textY: number } {
    let textX: number;
    let textY: number;

    // Compute the Y position for the text.
    switch (options.vAlign) {
      case 'top':
        textY = config.y + 2 + options.textHeight;
        break;
      case 'center':
        textY = config.y + config.height / 2 + options.textHeight / 2;
        break;
      case 'bottom':
        textY = config.y + config.height - 2;
        break;
      default:
        throw 'unreachable';
    }

    // Compute the X position for the text.
    switch (options.hAlign) {
      case 'left':
        textX = config.x + (isHeaderCell ? 10 : 2);
        break;
      case 'center':
        textX = config.x + config.width / 2;
        break;
      case 'right':
        textX = config.x + config.width - 3;
        break;
      default:
        throw 'unreachable';
    }

    return { textX, textY };
  }
}
