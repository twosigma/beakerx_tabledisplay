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

import { GraphicsContext, TextRenderer } from "@phosphor/datagrid";
import { expect } from 'chai';
import * as sinon from 'sinon';
import { BeakerXDataGrid } from "../../../../src/dataGrid/BeakerXDataGrid";
import { BeakerXCellRenderer, HeaderCellRenderer } from "../../../../src/dataGrid/cell/renderer";
import { createStore } from "../../../../src/dataGrid/store/BeakerXDataStore";
import { Theme } from "../../../../src/utils";
import { cellConfigMock, modelStateMock, tableDisplayWidgetMock } from "../../mock";

describe('HeaderCellRenderer', () => {
  let dataGrid;
  let cellRenderer;
  let dataStore;
  let gc;

  before(() => {
    dataStore = createStore({...modelStateMock, headersVertical: true});
    dataGrid = new BeakerXDataGrid({}, dataStore, tableDisplayWidgetMock as any);
    gc = new GraphicsContext(dataGrid['_canvasGC']);

    gc['_context'].fillText = () => {
    };
    cellRenderer = new HeaderCellRenderer(dataGrid);
  });

  after(() => {
    dataGrid.destroy();
  });

  it('should be an instance of BeakerXCellRenderer', () => {
    expect(cellRenderer).to.be.an.instanceof(BeakerXCellRenderer);
    expect(cellRenderer).to.be.an.instanceof(TextRenderer);
  });

  it('should implement drawText method', () => {
    expect(cellRenderer).to.have.property('drawText');
    expect(cellRenderer.drawText).to.be.a('Function');
  });

  it('should implement getBackgroundColor method', () => {
    expect(cellRenderer).to.have.property('getBackgroundColor');
    expect(cellRenderer.getBackgroundColor).to.be.a('Function');
    expect(cellRenderer.getBackgroundColor()).to.equal(Theme.DEFAULT_CELL_BACKGROUND);
  });

  it('should call drawText context method', () => {
    const fillTextStub = sinon.stub(gc, 'fillText');
    const rotateStub = sinon.stub(gc, 'rotate');
    const restoreStub = sinon.stub(gc, 'restore');

    cellRenderer.drawText(gc, cellConfigMock);

    expect(fillTextStub.calledOnce).to.be.true;
    expect(rotateStub.calledOnce).to.be.true;
    expect(restoreStub.calledOnce).to.be.true;

    fillTextStub.restore();
    rotateStub.restore();
    restoreStub.restore();
  });

  it('should call drawText context method', () => {
    const stub = sinon.stub(cellRenderer, 'getTextPosition');

    cellRenderer.font = undefined;
    cellRenderer.drawText(gc, cellConfigMock);

    expect(stub.called).to.be.false;

    stub.restore();
  });
});
