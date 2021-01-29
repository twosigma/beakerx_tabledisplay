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

import { expect } from 'chai';
import { DataGridStyle } from "../../../src/dataGrid/style/DataGridStyle";

describe('DataGridStyle', () => {

  describe('formatColor', () => {

    it('should return color', function () {
      expect(DataGridStyle.formatColor('#000000')).to.be.a('string').and.equal('#000000');
    });

    it('should fix color', function () {
      expect(DataGridStyle.formatColor('#00000000')).to.be.a('string').and.equal('#000000');
    });

  });

  describe('getDefaultColor', () => {

    it('should be a function', function () {
      expect(DataGridStyle.getDefaultColor).to.be.a('function');
    });

    it('should return #f15854 for "red"', function () {
      expect(DataGridStyle.getDefaultColor('red')).to.be.a('string').and.equal('#f15854');
    });

    it('should return #60bd68 for "green"', function () {
      expect(DataGridStyle.getDefaultColor('green')).to.be.a('string').and.equal('#60bd68');
    });

    it('should return #5da5da for "blue"', function () {
      expect(DataGridStyle.getDefaultColor('blue')).to.be.a('string').and.equal('#5da5da');
    });

  });

  describe('darken', () => {

    it('should be a function', () => {
      expect(DataGridStyle.darken).to.be.a('function');
    });

    it('should leave color as is if not in rgb(0, 0, 0) form', function () {
      expect(DataGridStyle.darken('#ffffff')).to.be.a('string').and.equal('#ffffff');
    });

    it('should darken color in rgb(0, 0, 0) form using default factor', function () {
      expect(DataGridStyle.darken('rgb(255,255,255)')).to.be.a('string').and.equal('#cccccc');
      expect(DataGridStyle.darken('rgb(64,128,255)')).to.be.a('string').and.equal('#3366cc');
    });

    it('should use given factor', function () {
      expect(DataGridStyle.darken('rgb(255,255,255)', 0.1)).to.be.a('string').and.equal('#191919');
      expect(DataGridStyle.darken('rgb(255,255,255)', 0.5)).to.be.a('string').and.equal('#7f7f7f');
      expect(DataGridStyle.darken('rgb(255,255,255)', 0.9)).to.be.a('string').and.equal('#e5e5e5');
    });

  });

});
