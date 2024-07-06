package main

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	g "xabbo.b7c.io/goearth"
	"xabbo.b7c.io/goearth/shockwave/in"
	"xabbo.b7c.io/goearth/shockwave/out"
)

type App struct {
	ext *g.Ext
	pos struct {
		W1, W2, L1, L2 int
		Direction      string
	}
	furniID         string
	logMessages     []string
	logMu           sync.Mutex
	lastActionTime  time.Time
	packetStructure string
	captureMode     bool
	captureMu       sync.Mutex
	ctx             context.Context
}

func NewApp() *App {
	return &App{
		ext: g.NewExt(g.ExtInfo{Title: "G-WallMover", Description: "Move wall items in Origins", Version: "1.0", Author: "QDave"}),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go a.runEarthExtension()
}

func (a *App) runEarthExtension() {
	a.ext.Intercept(out.CHAT).With(a.handleTalk)
	a.ext.Intercept(out.SHOUT).With(a.handleTalk)
	a.ext.Intercept(in.ITEMS_2).With(a.handleItems2Packet)
	a.ext.Intercept(in.UPDATEITEM).With(a.handleUpdateItemPacket)
	a.ext.Intercept(out.ADDSTRIPITEM).With(a.handleAddStripItem)
	a.ext.Run()
}

func (a *App) MoveItem(l1, l2, w1, w2 int) {
	if a.furniID == "" {
		a.AddLogMessage("Place some wall furni first")
		return
	}

	a.pos.L1 = l1
	a.pos.L2 = l2
	a.pos.W1 = w1
	a.pos.W2 = w2

	a.removeWallItem()
	a.placeWallItem()
	a.AddLogMessage("Moved wall item")
	a.lastActionTime = time.Now()
}

func (a *App) UpdatePosition(l1, l2, w1, w2 int) {
	a.pos.L1 = l1
	a.pos.L2 = l2
	a.pos.W1 = w1
	a.pos.W2 = w2

	updatedPacket := a.updatePacketStructure()
	a.ext.Send(in.ITEMS_2, []byte(updatedPacket))
	a.AddLogMessage(fmt.Sprintf("position: w=%d,%d l=%d,%d %s", a.pos.W1, a.pos.W2, a.pos.L1, a.pos.L2, a.pos.Direction))
}

func (a *App) AddLogMessage(message string) {
	a.logMu.Lock()
	defer a.logMu.Unlock()
	a.logMessages = append(a.logMessages, message)
	if len(a.logMessages) > 100 {
		a.logMessages = a.logMessages[1:]
	}
	runtime.EventsEmit(a.ctx, "logUpdate", strings.Join(a.logMessages, "\n"))
}

func (a *App) GetPosition() map[string]interface{} {
	return map[string]interface{}{
		"W1":        a.pos.W1,
		"W2":        a.pos.W2,
		"L1":        a.pos.L1,
		"L2":        a.pos.L2,
		"Direction": a.pos.Direction,
	}
}

func (a *App) handleTalk(e *g.InterceptArgs) {
	message := e.Packet.ReadString()
	if message == "#wallmover" {
		runtime.WindowShow(a.ctx)
		e.Block()
	}
}

func (a *App) handleItems2Packet(e *g.InterceptArgs) {
	a.packetStructure = e.Packet.ReadString()
	a.handleItemPacket(a.packetStructure, "Item placed")
}

func (a *App) handleUpdateItemPacket(e *g.InterceptArgs) {
	a.packetStructure = e.Packet.ReadString()
	a.handleItemPacket(a.packetStructure, "New Item ID Applied")
}

func (a *App) handleItemPacket(packetStructure string, actionType string) {
	parts := strings.Split(packetStructure, "\t")
	if len(parts) < 5 {
		return
	}
	newFurniID := parts[0]
	position := parts[3]
	positionParts := strings.Fields(position)
	var newPos struct {
		W1, W2, L1, L2 int
		Direction      string
	}
	for _, part := range positionParts {
		if strings.HasPrefix(part, ":w=") {
			wParts := strings.Split(strings.TrimPrefix(part, ":w="), ",")
			if len(wParts) == 2 {
				newPos.W1, _ = strconv.Atoi(wParts[0])
				newPos.W2, _ = strconv.Atoi(wParts[1])
			}
		} else if strings.HasPrefix(part, "l=") {
			lParts := strings.Split(strings.TrimPrefix(part, "l="), ",")
			if len(lParts) == 2 {
				newPos.L1, _ = strconv.Atoi(lParts[0])
				newPos.L2, _ = strconv.Atoi(lParts[1])
			}
		} else if part == "r" || part == "l" {
			newPos.Direction = part
		}
	}
	if time.Since(a.lastActionTime) >= 2*time.Second && (newFurniID != a.furniID || newPos != a.pos) {
		a.furniID = newFurniID
		a.pos = newPos
		runtime.EventsEmit(a.ctx, "positionUpdate", a.pos)
		a.AddLogMessage(fmt.Sprintf("%s: ID %s, Position: w=%d,%d l=%d,%d %s",
			actionType, a.furniID, a.pos.W1, a.pos.W2, a.pos.L1, a.pos.L2, a.pos.Direction))
	}
}

func (a *App) handleAddStripItem(e *g.InterceptArgs) {
	a.captureMu.Lock()
	if a.captureMode {
		a.captureMode = false
		a.captureMu.Unlock()
		packetContent := e.Packet.ReadString()
		parts := strings.Split(packetContent, " ")
		if len(parts) >= 3 {
			a.furniID = parts[2]
			a.AddLogMessage(fmt.Sprintf("Captured furni ID: %s", a.furniID))
		}
		return
	}
	a.captureMu.Unlock()
}

func (a *App) removeWallItem() {
	a.ext.Send(out.ADDSTRIPITEM, []byte("new item "+a.furniID))
	a.AddLogMessage("Sent ADDSTRIPITEM")
}

func (a *App) placeWallItem() {
	placestuffData := fmt.Sprintf("%s :w=%d,%d l=%d,%d %s", a.furniID, a.pos.W1, a.pos.W2, a.pos.L1, a.pos.L2, a.pos.Direction)
	a.ext.Send(out.PLACESTUFF, []byte(placestuffData))
	a.AddLogMessage("Sent PLACESTUFF")
}

func (a *App) updatePacketStructure() string {
	parts := strings.Split(a.packetStructure, "\t")
	if len(parts) < 5 {
		return a.packetStructure
	}
	parts[3] = fmt.Sprintf(":w=%d,%d l=%d,%d %s", a.pos.W1, a.pos.W2, a.pos.L1, a.pos.L2, a.pos.Direction)
	return strings.Join(parts, "\t")
}
