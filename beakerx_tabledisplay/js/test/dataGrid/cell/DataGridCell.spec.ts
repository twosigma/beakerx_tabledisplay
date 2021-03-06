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
import { DataGridCell } from "../../../src/dataGrid/cell/DataGridCell";
import { cellConfigMock } from "../mock";

describe('DataGridCell', () => {
  describe('isHeaderCell', () => {
    it('should return true', () => {
      expect(DataGridCell.isHeaderCell({...cellConfigMock, region: 'column-header'})).to.be.true;
    });

    it('should return false', () => {
      let mock = {...cellConfigMock};
      expect(DataGridCell.isHeaderCell(mock)).to.be.false;
    });
  });
});
