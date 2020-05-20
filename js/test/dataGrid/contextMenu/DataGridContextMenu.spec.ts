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

import { Widget } from '@phosphor/widgets';
import { expect } from 'chai';
import { DataGridScope } from "../../../src/dataGrid";
import { DataGridContextMenu } from "../../../src/dataGrid/contextMenu/DataGridContextMenu";
import { modelStateMock, tableDisplayWidgetMock } from "../mock";

describe('DataGridContextMenu', () => {
  let dataGridScope;
  let contextMenu;

  before(() => {
    const scopeOptions = {
      element: document.createElement('div'),
      widgetView: tableDisplayWidgetMock,
      widgetModel: new Widget({}),
      data: modelStateMock
    };

    dataGridScope = new DataGridScope(scopeOptions);
    contextMenu = dataGridScope.contextMenu;
  });

  after(() => {
    dataGridScope.doDestroy();
  });

  it('should be an instance of DataGridContextMenu', () => {
    expect(contextMenu).to.be.an.instanceof(DataGridContextMenu);
  });

  it('should have the contextMenu property', () => {
    expect(contextMenu).to.have.property('contextMenu');
    expect(contextMenu.contextMenu.constructor.name).to.equal('ContextMenu');
  });

  it('should implement buildMenu method', () => {
    expect(contextMenu).to.have.property('buildMenu');
    expect(contextMenu.buildMenu).to.be.a('Function');
  });

});
