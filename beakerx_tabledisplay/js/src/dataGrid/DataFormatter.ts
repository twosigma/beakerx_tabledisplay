/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
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

import { CellRenderer } from '@lumino/datagrid';
import Big from 'big.js';
import moment from 'moment-timezone';
import * as _ from 'underscore';
import { ALL_TYPES, getDoublePrecisionByType, isDoubleWithPrecision } from './dataTypes';
import { DataGridHelpers } from './Helpers';
import { IColumnState } from './interface/IColumn';
import { BeakerXDataStore } from './store/BeakerXDataStore';
import { TIME_UNIT_FORMATS } from './consts';

export const DEFAULT_TIME_FORMAT = 'YYYYMMDD HH:mm:ss.SSS ZZ';

export class DataFormatter {
  store: BeakerXDataStore;

  constructor(store: BeakerXDataStore) {
    this.store = store;

    this.handleNull = this.handleNull.bind(this);
    this.value = this.value.bind(this);
    this.string = this.string.bind(this);
    this.integer = this.integer.bind(this);
    this.formattedInteger = this.formattedInteger.bind(this);
    this.double = this.double.bind(this);
    this.doubleWithPrecision = this.doubleWithPrecision.bind(this);
    this.exponential_5 = this.exponential_5.bind(this);
    this.exponential_15 = this.exponential_15.bind(this);
    this.datetime = this.datetime.bind(this);
    this.boolean = this.boolean.bind(this);
    this.html = this.html.bind(this);
    this.rawValue = this.rawValue.bind(this);
    this.percentage = this.percentage.bind(this);
  }

  destroy(): void {
    this.store = null;
  }

  get stringFormatForColumn() {
    return this.store.selectStringFormatForColumn();
  }

  get timeStrings() {
    return this.store.selectTimeStrings();
  }

  get timeZone() {
    return this.store.selectTimeZone();
  }

  get stringFormatForType() {
    return this.store.selectStringFormatForType();
  }

  get formatForTimes() {
    return this.store.selectFormatForTimes();
  }

  get columnNames() {
    return this.store.selectColumnNames();
  }

  getFormatFnByDisplayType(displayType, columnState?: IColumnState): CellRenderer.ConfigFunc<string> {
    if (isDoubleWithPrecision(displayType)) {
      return this.doubleWithPrecision(getDoublePrecisionByType(displayType));
    }

    switch (displayType) {
      case 1:
        return this.integer;
      case 2:
        return this.formattedInteger;
      case 3:
        return this.double;
      case 6:
        return this.exponential_5;
      case 7:
        return this.exponential_15;
      case 8:
        return this.datetimeWithFormat(this.getTimeFormatForColumn(columnState));
      case 9:
        return this.boolean;
      case 10:
        return this.html;
      case 11:
        return this.rawValue;
      case ALL_TYPES.percentage:
        return this.percentage;
      default:
        return this.string;
    }
  }

  private isNull(value: any) {
    return value === undefined || value === '' || value === 'null' || value === null;
  }

  private handleNull(formatFn: CellRenderer.ConfigFunc<string>): CellRenderer.ConfigFunc<string> {
    return (config: CellRenderer.CellConfig): string => {
      if (this.isNull(config.value)) {
        return config.value;
      }

      return <string>formatFn(config);
    };
  }

  private rawValue(config: CellRenderer.CellConfig) {
    return config.value;
  }

  private value(config: CellRenderer.CellConfig): string {
    const columnName = this.columnNames[config.column];

    return this.stringFormatForColumn[columnName].values[columnName][config.row];
  }

  private string(config: CellRenderer.CellConfig) {
    const objectValue = _.isObject(config.value);
    const stringFormatForColumn = this.stringFormatForColumn[this.columnNames[config.column]];
    let formattedValue = config.value !== null ? config.value : '';

    if (!objectValue && stringFormatForColumn && stringFormatForColumn.type === 'value') {
      return this.value(config);
    }

    if (objectValue) {
      formattedValue =
        config.value.type === 'Date'
          ? moment(config.value.timestamp).format(DEFAULT_TIME_FORMAT)
          : JSON.stringify(config.value);
    }

    return DataGridHelpers.truncateString(formattedValue);
  }

  private integer(config: CellRenderer.CellConfig) {
    if (this.isNull(config.value)) {
      return config.value;
    }

    return parseInt(config.value);
  }

  private formattedInteger(config: CellRenderer.CellConfig) {
    if (this.isNull(config.value)) {
      return config.value;
    }

    const x = parseInt(config.value);

    if (!isNaN(x)) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    return x;
  }

  private double(config: CellRenderer.CellConfig) {
    if (this.isNull(config.value)) {
      return config.value;
    }

    const doubleValue = parseFloat(config.value);
    const colFormat = this.stringFormatForColumn[this.columnNames[config.column]];
    const typeFormat = this.stringFormatForType['double'];
    const format = colFormat && colFormat.type === 'decimal' ? colFormat : typeFormat;

    if (!format || format.type !== 'decimal') {
      return doubleValue;
    }

    const precision = doubleValue.toString().split('.')[1];
    if (precision && precision.length >= format.maxDecimals) {
      return doubleValue.toFixed(format.maxDecimals);
    }

    return doubleValue.toFixed(format.minDecimals);
  }

  private doubleWithPrecision(precision: any): CellRenderer.ConfigFunc<string> {
    return this.handleNull((config: CellRenderer.CellConfig) => {
      return parseFloat(config.value).toFixed(precision);
    });
  }

  private exponential_5(config: CellRenderer.CellConfig): string {
    if (this.isNull(config.value)) {
      return config.value;
    }

    return parseFloat(config.value).toExponential(5);
  }

  private exponential_15(config: CellRenderer.CellConfig): string {
    if (this.isNull(config.value)) {
      return config.value;
    }

    return parseFloat(config.value).toExponential(15);
  }

  private datetime(config: CellRenderer.CellConfig, formatForTimes: any): string {
    if (this.timeStrings) {
      return this.timeStrings[config.row];
    }
    const value = config.value;
    if (value === 'NaT') {
      return value;
    }
    if (value === null) {
      return 'null';
    }
    return this.formatDatetime(value, formatForTimes);
  }

  private formatDatetime(value: any, formatForTimes: any) {
    let format = TIME_UNIT_FORMATS.DATETIME.format;
    let valueModifier = 1000;

    if (formatForTimes) {
      format = formatForTimes.format;
      valueModifier = formatForTimes.valueModifier;
    }

    if (_.isObject(value) && value.type === 'Date') {
      const tz = Object.prototype.hasOwnProperty.call(value, 'tz') ? value.tz : this.timeZone;
      return DataGridHelpers.formatTimestamp(value.timestamp, tz, format);
    }

    const milli = isNaN(value) ? value : new Big(value).times(valueModifier);

    return DataGridHelpers.formatTimestamp(milli, this.timeZone, format);
  }

  private getTimeFormatForColumn(columnState?: IColumnState) {
    return columnState && columnState.formatForTimes ? columnState.formatForTimes : this.formatForTimes;
  }

  private datetimeWithFormat(formatForTimes?: any) {
    return (config) => this.datetime(config, formatForTimes);
  }

  private boolean(config: CellRenderer.CellConfig): string {
    return this.isNull(config.value) ||
      config.value === false ||
      (typeof config.value === 'number' && isNaN(config.value))
      ? 'false'
      : 'true';
  }

  private html(config: CellRenderer.CellConfig): string {
    return config.value;
  }

  /**
   * Format numbers as percentage
   * @param config
   */
  private percentage(config: CellRenderer.CellConfig): string {
    if (this.isNull(config.value)) {
      return config.value;
    }

    const value = parseFloat(config.value);

    if (isNaN(value)) {
      return 'NaN';
    }

    return value.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });
  }
}
