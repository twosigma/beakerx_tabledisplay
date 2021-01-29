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

import { DataGrid } from "@phosphor/datagrid";
import { expect } from 'chai';
import { Theme } from "../../src/utils";

function switchToDarkTheme(): void {
  document.body.classList.add('bx-dark-theme');
}

function switchToLightTheme(): void {
  document.body.classList.remove('bx-dark-theme');
}

describe('Theme', () => {

  describe('Theme.isDark', () => {

    it('should detect dark style', function () {
      switchToLightTheme();
      expect(Theme.isDark).to.be.false;
      switchToDarkTheme();
      expect(Theme.isDark).to.be.true;
    });

  });

  describe('Theme.getStyle', () => {

    it('should return an object', function () {
      expect(Theme.getStyle()).to.be.an('object');
    });

    it('should return same properties as DataGrid.defaultStyle', function () {
      expect(Theme.getStyle()).to.have.any.keys(Object.keys(DataGrid.defaultStyle));
    });

    describe('in light theme', () => {

      before(() => {
        switchToLightTheme();
      });

      it('should have a voidColor set to #ffffff', function () {
        expect(Theme.getStyle().voidColor).to.equal('#ffffff');
      });

      it('should have a headerBackgroundColor set to #e6e6e6', function () {
        expect(Theme.getStyle().headerBackgroundColor).to.equal('#e6e6e6');
      });

      it('should have a gridLineColor set to #d4d0d0', function () {
        expect(Theme.getStyle().gridLineColor).to.equal('#d4d0d0');
      });

      it('should have a rowBackgroundColor method', function () {
        expect(Theme.getStyle().rowBackgroundColor).to.be.a('function');
        expect(Theme.getStyle().rowBackgroundColor(0)).to.equal('#f9f9f9');
        expect(Theme.getStyle().rowBackgroundColor(1)).to.equal('');
      });

    });

    describe('in dark theme', () => {

      before(() => {
        switchToDarkTheme();
      });

      it('should have a voidColor set to #636363', function () {
        expect(Theme.getStyle().voidColor).to.equal('#636363');
      });

      it('should have a backgroundColor set to #212121', function () {
        expect(Theme.getStyle().backgroundColor).to.equal('#212121');
      });

      it('should have a headerBackgroundColor set to #252525', function () {
        expect(Theme.getStyle().headerBackgroundColor).to.equal('#252525');
      });

      it('should have a gridLineColor set to #626262', function () {
        expect(Theme.getStyle().gridLineColor).to.equal('#626262');
      });

      it('should have a headerGridLineColor set to #626262', function () {
        expect(Theme.getStyle().headerGridLineColor).to.equal('#626262');
      });

      it('should have a rowBackgroundColor method', function () {
        expect(Theme.getStyle().rowBackgroundColor).to.be.a('function');
        expect(Theme.getStyle().rowBackgroundColor(0)).to.equal('#424242');
        expect(Theme.getStyle().rowBackgroundColor(1)).to.equal('');
      });

    });

  });

  describe('should have theme dependent properties', () => {

    describe('in light theme', () => {

      before(() => {
        switchToLightTheme();
      });

      it('should have DEFAULT_DATA_FONT_COLOR set to #000000', () => {
        expect(Theme.DEFAULT_DATA_FONT_COLOR).to.be.a('string').and.equal('#000000');
      });

      it('should have DEFAULT_HEADER_FONT_COLOR set to #515a5a', () => {
        expect(Theme.DEFAULT_HEADER_FONT_COLOR).to.be.a('string').and.equal('#515a5a');
      });

      it('should have DEFAULT_HIGHLIGHT_COLOR set to #6ba2c7', () => {
        expect(Theme.DEFAULT_HIGHLIGHT_COLOR).to.be.a('string').and.equal('#6ba2c7');
      });

      it('should have DEFAULT_CELL_BACKGROUND set to ""', () => {
        expect(Theme.DEFAULT_CELL_BACKGROUND).to.be.a('string').and.equal('');
      });

      it('should have FOCUSED_CELL_BACKGROUND set to #c8c8c8', () => {
        expect(Theme.FOCUSED_CELL_BACKGROUND).to.be.a('string').and.equal('#c8c8c8');
      });

      it('should have SELECTED_CELL_BACKGROUND set to #b0bed9', () => {
        expect(Theme.SELECTED_CELL_BACKGROUND).to.be.a('string').and.equal('#b0bed9');
      });

      it('should have HIGHLIGHTED_CELL_BACKGROUND_EVEN set to rgb(241, 241, 241)', () => {
        expect(Theme.HIGHLIGHTED_CELL_BACKGROUND_EVEN).to.be.a('string').and.equal('rgb(241, 241, 241)');
      });

      it('should have HIGHLIGHTED_CELL_BACKGROUND_ODD set to rgb(249, 249, 249)', () => {
        expect(Theme.HIGHLIGHTED_CELL_BACKGROUND_ODD).to.be.a('string').and.equal('rgb(249, 249, 249)');
      });

      it('should have MIN_LIGHTNESS_VALUE set to 35', () => {
        expect(Theme.MIN_LIGHTNESS_VALUE).to.be.a('number').and.equal(35);
      });

      it('should have MIN_SATURATION_VALUE set to 35', () => {
        expect(Theme.MIN_SATURATION_VALUE).to.be.a('number').and.equal(35);
      });

    });

    describe('in dark theme', () => {

      before(() => {
        switchToDarkTheme();
      });

      it('should have DEFAULT_DATA_FONT_COLOR set to #ffffff', () => {
        expect(Theme.DEFAULT_DATA_FONT_COLOR).to.be.a('string').and.equal('#ffffff');
      });

      it('should have DEFAULT_HEADER_FONT_COLOR set to #ffffff', () => {
        expect(Theme.DEFAULT_HEADER_FONT_COLOR).to.be.a('string').and.equal('#ffffff');
      });

      it('should have DEFAULT_HIGHLIGHT_COLOR set to #dfdfdf', () => {
        expect(Theme.DEFAULT_HIGHLIGHT_COLOR).to.be.a('string').and.equal('#dfdfdf');
      });

      it('should have DEFAULT_CELL_BACKGROUND set to ""', () => {
        expect(Theme.DEFAULT_CELL_BACKGROUND).to.be.a('string').and.equal('');
      });

      it('should have FOCUSED_CELL_BACKGROUND set to #66bb6a', () => {
        expect(Theme.FOCUSED_CELL_BACKGROUND).to.be.a('string').and.equal('#66bb6a');
      });

      it('should have SELECTED_CELL_BACKGROUND set to #2196f3', () => {
        expect(Theme.SELECTED_CELL_BACKGROUND).to.be.a('string').and.equal('#2196f3');
      });

      it('should have HIGHLIGHTED_CELL_BACKGROUND_EVEN set to rgb(34, 34, 34)', () => {
        expect(Theme.HIGHLIGHTED_CELL_BACKGROUND_EVEN).to.be.a('string').and.equal('rgb(34, 34, 34)');
      });

      it('should have HIGHLIGHTED_CELL_BACKGROUND_ODD set to rgb(26, 26, 26)', () => {
        expect(Theme.HIGHLIGHTED_CELL_BACKGROUND_ODD).to.be.a('string').and.equal('rgb(26, 26, 26)');
      });

      it('should have MIN_LIGHTNESS_VALUE set to 15', () => {
        expect(Theme.MIN_LIGHTNESS_VALUE).to.be.a('number').and.equal(15);
      });

      it('should have MIN_SATURATION_VALUE set to 15', () => {
        expect(Theme.MIN_SATURATION_VALUE).to.be.a('number').and.equal(15);
      });

    });

  });

});
