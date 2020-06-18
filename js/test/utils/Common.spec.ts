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
import { Common } from "../../src/utils";

describe('Common', () => {
  describe('Common.formatTimestamp', () => {

    it('should return string', () => {
      let timestamp = 1589315381269;
      let formated = Common.formatTimestamp(timestamp, 'UTC', 'YYYYMMDD HH:mm:ss.SSS ZZ');
      expect(formated).to.equal('20200512 20:29:41.269 +0000');
    });

    it('should apply timezone CET', () => {
      let timestamp = 1589315381269;
      let formated;
      formated = Common.formatTimestamp(timestamp, 'CET', 'YYYYMMDD HH:mm:ss.SSS ZZ');
      expect(formated).to.equal('20200512 22:29:41.269 +0200');
    });

    it('should apply timezone EST', () => {
      let timestamp = 1589315381269;
      let formated;
      formated = Common.formatTimestamp(timestamp, 'EST', 'YYYYMMDD HH:mm:ss.SSS ZZ');
      expect(formated).to.equal('20200512 15:29:41.269 -0500');
    });

    it('should apply timezone GMT+1', () => {
      let timestamp = 1589315381269;
      let formated;
      formated = Common.formatTimestamp(timestamp, 'GMT+1', 'YYYYMMDD HH:mm:ss.SSS ZZ');
      expect(formated).to.equal('20200512 20:29:41.269 +0000');
    });

  });

  describe('Common.generateId', () => {
    it('should return string', function () {
      let str = Common.generateId();
      expect(str).to.be.a('string');
      expect(str).to.have.property('length');
      expect(str.length).to.equal(6);
    });
  });

  describe('Common.rgbaToHex', () => {

    it('should return string', function () {
      let str = Common.rgbaToHex(0, 0, 0, 0);
      expect(str).to.be.a('string');
      expect(str).to.equal('#000000');
    });

    it('rgba(128,0,0) => #800000', function () {
      let str = Common.rgbaToHex(128, 0, 0);
      expect(str).to.equal('#800000');
    });

    it('rgba(0,128,0) => #008000', function () {
      let str = Common.rgbaToHex(0, 128, 0);
      expect(str).to.equal('#008000');
    });

    it('rgba(0,0,255) => #0000ff', function () {
      let str = Common.rgbaToHex(0, 0, 255);
      expect(str).to.equal('#0000ff');
    });
  });
});
